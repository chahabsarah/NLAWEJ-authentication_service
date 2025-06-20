const Avis = require("../models/Avis");
const Evaluation = require("../models/Evaluation");
const Projet = require("../models/Project");
const User = require('../models/User'); // Assure-toi d'importer le modèle User

exports.createEvaluation = async (req, res) => {
  try {
    const { projetId, rate, message ,userId} = req.body;
    

    const projet = await Projet.findById(projetId);

    if (!projet) {
      return res.status(404).json({ message: 'Projet introuvable.' });
    }

    if (projet.statutProjet !== 'done') {
      return res.status(400).json({ message: 'Le projet n’est pas encore terminé.' });
    }

    if (projet.habitant.toString() !== userId) {
      return res.status(403).json({ message: 'Non autorisé à évaluer ce projet.' });
    }

    let avis = null;
    if (message && message.trim() !== '') {
      avis = new Avis({ message });
      await avis.save();
    }

    const evaluation = new Evaluation({
      projet: projetId,
      habitant: userId,
      rate,
      avis: avis ? avis._id : undefined
    });

    await evaluation.save();

    // ➕ Récupère l'artisan et met à jour son score
    const artisanId = projet.artisan;
    const artisan = await User.findById(artisanId);

    if (artisan) {
      // Récupère tous les projets DONE de cet artisan
      const projetsDone = await Projet.find({ artisan: artisanId, statutProjet: 'done' });

      // Récupère toutes les évaluations des projets DONE
      const evaluations = await Evaluation.find({ projet: { $in: projetsDone.map(p => p._id) } });

      // Calcule la moyenne
      const total = evaluations.reduce((sum, ev) => sum + ev.rate, 0);
      const moyenne = evaluations.length > 0 ? total / evaluations.length : rate;

      artisan.score = moyenne;
      await artisan.save();
    }

    return res.status(201).json({ message: 'Évaluation enregistrée et score mis à jour.', evaluation });
  } catch (error) {
    console.error('Erreur createEvaluation:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
