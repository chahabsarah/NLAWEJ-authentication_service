const Devis = require('../models/Devis');
const CalendrierTravail = require('../models/CalendrierTravail');
const Projet = require('../models/Project');
const Demande = require('../models/Demande');

const createDevis = async (req, res) => {
  try {
    const {habitant,artisan}=req.params;
    const { demande, prixMin, prixMax, dureeTravail, materiaux } = req.body;

    const existingDevis = await Devis.findOne({ demande, artisan });
    if (existingDevis) {
      return res.status(400).json({ message: 'Vous avez déjà proposé un devis pour cette demande.' });
    }

    const devis = new Devis({ habitant,demande, artisan,habitant, prixMin, prixMax, dureeTravail, materiaux });
    await devis.save();

    res.status(201).json({ message: 'Devis créé avec succès', devis });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du devis', error });
  }
};

const getAllDevis = async (req, res) => {
  try {
    const devisList = await Devis.find().populate('demande artisan');
    res.status(200).json(devisList);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des devis', error });
  }
};

const getDevisById = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id).populate('demande artisan');
    if (!devis) return res.status(404).json({ message: 'Devis non trouvé' });

    res.status(200).json(devis);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du devis', error });
  }
};

const updateDevis = async (req, res) => {
  try {
    const updatedDevis = await Devis.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedDevis) return res.status(404).json({ message: 'Devis non trouvé' });

    res.status(200).json({ message: 'Devis mis à jour avec succès', updatedDevis });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du devis', error });
  }
};

const deleteDevis = async (req, res) => {
  try {
    const deletedDevis = await Devis.findByIdAndDelete(req.params.id);
    if (!deletedDevis) return res.status(404).json({ message: 'Devis non trouvé' });

    res.status(200).json({ message: 'Devis supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du devis', error });
  }
};

const getDevisByDemande = async (req, res) => {
  try {
    const devis = await Devis.find({ demande: req.params.demandeId }).populate('artisan');
    res.status(200).json(devis);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des devis pour cette demande', error });
  }
};
const accepterDevis = async (req, res) => {
  try {
    const { devisId } = req.params;

    const devis = await Devis.findById(devisId);
    if (!devis) {
      return res.status(404).json({ message: "Devis introuvable." });
    }
      console.log('devisid :',devisId)

    console.log('devis.demande :',devis.demande.toString())

  const demandeService = await Demande.findById(devis.demande.toString());
  if (!demandeService){
          return res.status(404).json({ message: "demande introuvable." });

  }
  console.log('demandeService :',demandeService)
    const alreadyAccepted = await Devis.findOne({
      demande: devis.demande,
      status: 'accepted'
    });
    if (alreadyAccepted) {
      return res.status(400).json({ message: "Un devis a déjà été accepté pour cette demande." });
    }

    devis.status = 'accepted';
    demandeService.statut='closed'
    await CalendrierTravail.create({
      devis: devisId,
      habitant: devis.habitant,
      artisan: devis.artisan,
      dureeTravail: devis.dureeTravail
    });
    await devis.save();

    await Devis.updateMany(
      {
        demande: devis.demande,
        _id: { $ne: devis._id }
      },
      { $set: { status: 'rejected' } }
    );
const calendar = await CalendrierTravail.findOne({ devis: devisId });
 const projetExiste = await Projet.findOne({ devis: devisId });
    if (!projetExiste) {
      const nouveauProjet = new Projet({
        nom: demandeService.message,
        service: demandeService.typeService,
        habitant: devis.habitant,
        artisan: devis.artisan,
        dureeTravail: devis.dureeTravail,
        budget: {
          min: devis.prixMin,
          max: devis.prixMax
        },
        devis: devisId,
        calenderId:calendar._id,
      });

      await nouveauProjet.save();
    }

    res.status(200).json({ message: "Devis accepté avec succès.", devis });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'acceptation du devis.", error });
  }
};
const getDevisByDemandeAndUser = async (req, res) => {
  try {
    const { demandeId, userId } = req.params;
    const devis = await Devis.findOne({ demande: demandeId, artisan: userId }).populate('demande artisan habitant');

    if (!devis) {
      return res.status(404).json({ message: 'Devis non trouvé pour cette demande et cet utilisateur.' });
    }

    res.status(200).json(devis);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du devis', error });
  }
};

module.exports = {
  createDevis,
  getAllDevis,
  getDevisById,
  updateDevis,
  deleteDevis,
  getDevisByDemande,
  accepterDevis,
  getDevisByDemandeAndUser
};
