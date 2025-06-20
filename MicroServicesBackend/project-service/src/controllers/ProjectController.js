const Projet = require('../models/Project');

const ajouterWorkflow = async (req, res) => {
  try {
    const { projetId } = req.params;
    const { commentaire } = req.body;
    
    const photoAvant = req.files?.photoAvant?.[0]?.path;
    const photoApres = req.files?.photoApres?.[0]?.path;

    const projet = await Projet.findById(projetId);
    if (!projet) {
      return res.status(404).json({ message: "Projet non trouvé." });
    }

    projet.workflow.push({
      date: new Date(),
      photoAvant: photoAvant || undefined,
      photoApres: photoApres || undefined,
      commentaire: commentaire || ''
    });

    await projet.save();
    res.status(200).json({ message: "Workflow mis à jour avec succès.", projet });
  } catch (error) {
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour du workflow.", 
      error: error.message 
    });
  }
};

const getProjetsParUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const role = req.query.role; // 'habitant' ou 'artisan'

    const filter = {};
    
    if (role === 'habitant') {
      filter.habitant = userId;
    } else if (role === 'artisan') {
      filter.artisan = userId;
    } else {
      return res.status(400).json({ message: "Rôle non valide" });
    }

    const projets = await Projet.find(filter)
      .populate('service')
      .populate('artisan', 'fullName email')
      .populate('devis',)
      .populate('habitant', 'fullName email');

    res.status(200).json(projets);
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la récupération des projets.",
      error: err.message
    });
  }
};
const getProjets = async (req, res) => {
 try {
    const projets = await Projet.find()
      .populate('service')
      .populate('artisan', 'fullName email')
      .populate('devis');

    res.status(200).json(projets);
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la récupération des projets.",
      error: err.message
    });
  }
};
const getProjetParId = async (req, res) => {
  try {
    const projet = await Projet.findById(req.params.id)
      .populate('service')
      .populate('artisan')
      .populate('devis');

    if (!projet) return res.status(404).json({ message: "Projet non trouvé." });

    res.status(200).json(projet);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération du projet.", error: err.message });
  }
};

const updateStatutProjet = async (req, res) => {
  try {
    const { statutProjet, statutPaiement } = req.body;

    const projet = await Projet.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(statutProjet && { statutProjet }),
          ...(statutPaiement && { statutPaiement })
        }
      },
      { new: true }
    );

    if (!projet) return res.status(404).json({ message: "Projet non trouvé." });

    res.status(200).json({ message: "Statut mis à jour.", projet });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la mise à jour.", error: err.message });
  }
};
const getProjetByDevisId = async (req, res) => {
  try {
    const { devisId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(devisId)) {
      return res.status(400).json({ message: 'ID de devis invalide' });
    }

    const projet = await Projet.findOne({ devis: devisId })
      .populate({
        path: 'service',
        select: 'nom description'
      })
      .populate({
        path: 'habitant',
        select: 'nom prenom email'
      })
      .populate({
        path: 'artisan',
        select: 'nom prenom metier'
      })
      .populate({
        path: 'devis',
        select: 'prixMin prixMax dureeTravail status'
      });

    if (!projet) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }
    const response = {
      id: projet._id,
      nom: projet.nom,
      duree: projet.dureeTravail,
      statut: projet.statutProjet,
      paiement: projet.statutPaiement,
      service: projet.service,
      habitant: projet.habitant,
      artisan: projet.artisan,
      devis: projet.devis,
      workflow: projet.workflow,
      createdAt: projet.createdAt
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};
module.exports={ajouterWorkflow,getProjetsParUserId,getProjetParId,updateStatutProjet
,getProjets,getProjetByDevisId}