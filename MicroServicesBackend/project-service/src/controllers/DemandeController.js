const Demande = require('../models/Demande');

const createDemande = async (req, res) => {
  try {
    const { idHabitant } = req.params;
    const { typeService, message, location } = req.body;

    if (!typeService || !message) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    const demande = new Demande({ typeService, message, location, idHabitant });
    await demande.save();

    res.status(201).json({ message: 'Demande créée avec succès', demande });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création', error });
  }
};


const getAllDemandes = async (req, res) => {
  try {
    const demandes = await Demande.find()
      .populate('typeService', 'nom')
      .populate('idHabitant', 'nom email');
    res.status(200).json(demandes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération', error });
  }
};

const getDemandeById = async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id)
      .populate('typeService', 'nom')
      .populate('idHabitant', 'nom email');

    if (!demande) {
      return res.status(404).json({ message: 'Demande introuvable' });
    }

    res.status(200).json(demande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération', error });
  }
};

const updateDemande = async (req, res) => {
  try {
    const { typeService, message, location } = req.body;

    const updated = await Demande.findByIdAndUpdate(
      req.params.id,
      { typeService, message, location },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Demande introuvable' });
    }

    res.status(200).json({ message: 'Demande mise à jour', demande: updated });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error });
  }
};

const deleteDemande = async (req, res) => {
  try {
    const deleted = await Demande.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Demande introuvable' });
    }

    res.status(200).json({ message: 'Demande supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error });
  }
};
const getDemandeByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const demandes = await Demande.find({ idHabitant: userId })
      .populate('typeService', 'nom description')
      .populate('idHabitant', 'nom email');

    if (!demandes || demandes.length === 0) {
      return res.status(404).json({ message: "Aucune demande trouvée pour cet utilisateur." });
    }

    res.status(200).json(demandes);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des demandes.", error });
  }
};
module.exports = {
  createDemande,getAllDemandes,getDemandeById,updateDemande,deleteDemande,
  getDemandeByUserId
};
