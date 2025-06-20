const CalendrierTravail = require('../models/CalendrierTravail');
const Projet = require('../models/Project');

const ajouterCreneau = async (req, res) => {
  try {
    const calendrier = await CalendrierTravail.findById(req.params.id);
    if (!calendrier) return res.status(404).json({ message: 'Calendrier non trouvé' });

    calendrier.creneaux.push(req.body); // { date, heureDebut, heureFin }
    calendrier.statut = 'en_attente_choix';
    await calendrier.save();

    res.status(200).json({ message: 'Créneau ajouté', calendrier });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout de créneau', error: err.message });
  }
};
const choisirCreneau = async (req, res) => {
  try {
    // 1. Trouver le calendrier
    const calendrier = await CalendrierTravail.findById(req.params.id);
    if (!calendrier) {
      return res.status(404).json({ message: 'Calendrier non trouvé' });
    }

    // 2. Vérifier le créneau
    const creneauId = req.params.creneauId;
    const creneau = calendrier.creneaux.id(creneauId);
    if (!creneau) {
      return res.status(400).json({ message: 'Créneau introuvable' });
    }

    // 3. Vérifier les jours déjà choisis
    const joursChoisis = new Set(
      calendrier.creneaux
        .filter(c => c.choisiParHabitant)
        .map(c => c.date.toISOString().split('T')[0])
    );

    const jourDuCreneau = creneau.date.toISOString().split('T')[0];

    // 4. Validations
    if (joursChoisis.has(jourDuCreneau)) {
      return res.status(400).json({ message: 'Un créneau a déjà été choisi pour ce jour.' });
    }

    if (joursChoisis.size >= calendrier.dureeTravail) {
      if (joursChoisis.size === calendrier.dureeTravail) {
        const projet = await Projet.findOne({ devis: req.params.id });
        if (projet) {
          projet.statutProjet = "active";
          await projet.save();
          return res.status(201).json({ 
            message: `Votre projet est lancé ! Bon courage !`,
            projetActivated: true
          });
        }
      }
      return res.status(400).json({ 
        message: `Vous avez déjà sélectionné ${calendrier.dureeTravail} jours.` 
      });
    }

    // 6. Marquer le créneau comme choisi
    creneau.choisiParHabitant = true;

    // 7. Mettre à jour le statut du calendrier
    const updatedJours = new Set([...joursChoisis, jourDuCreneau]);
    calendrier.statut = (updatedJours.size === calendrier.dureeTravail) 
      ? 'validé' 
      : 'en_attente_choix';

    // 8. Sauvegarder les modifications
    await calendrier.save();
    
    // 9. Vérifier si c'est le dernier créneau nécessaire
   const projet = await Projet.findOne({ devis: calendrier.devis });
      
      if (projet) {
        projet.statutProjet = "active";
        await projet.save();
        
        return res.status(200).json({
          message: `Dernier créneau sélectionné ! Projet activé pour le ${jourDuCreneau}`,
          calendrier,
          projetActivated: true,
          projet: projet
        });
      } else {
        console.log('Projet non trouvé pour le devis:', calendrier.devis);
      }
    // 10. Réponse standard
    res.status(200).json({
      message: `Créneau sélectionné pour le ${jourDuCreneau}`,
      calendrier,
      projetActivated: false
    });

  } catch (err) {
    console.error('Erreur choisirCreneau:', err);
    res.status(500).json({ 
      message: 'Erreur lors du choix du créneau', 
      error: err.message 
    });
  }
};

const getCalendrierByDevisId = async (req, res) => {
  try {
    const calendrier = await CalendrierTravail.findOne({ devis: req.params.devisId })
      .populate('devis habitant artisan');

    if (!calendrier) {
      return res.status(404).json({ message: 'Calendrier non trouvé pour ce devis' });
    }

    res.status(200).json(calendrier);
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération du calendrier par devis',
      error: error.message,
    });
  }
};

const getCreneauxByCalendrierId = async (req, res) => {
  try {
    const c = await CalendrierTravail.findById(req.params.calenderId);

    if (!c) {
      return res.status(404).json({ message: 'Aucune calendrier trouvé!.' });
    }

    const creneauxNonChoisis = c.creneaux.filter(c => !c.choisiParHabitant);

    res.status(200).json(creneauxNonChoisis);
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des créneaux',
      error: error.message
    });
  }
};
const modifierCreneau = async (req, res) => {
  try {
    const calendrierId = req.params.id;
    const creneauId = req.params.creneauId;
    const updates = req.body;

    const calendrier = await CalendrierTravail.findById(calendrierId);
    if (!calendrier) {
      return res.status(404).json({ message: 'Calendrier non trouvé' });
    }

    const creneau = calendrier.creneaux.id(creneauId);
    if (!creneau) {
      return res.status(404).json({ message: 'Créneau non trouvé' });
    }

    if (creneau.choisiParHabitant) {
      return res.status(400).json({ 
        message: 'Impossible de modifier un créneau déjà choisi' 
      });
    }

    const allowedUpdates = ['date', 'heureDebut', 'heureFin'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        creneau[key] = updates[key];
      }
    });

    const updatedCalendrier = await calendrier.save();

    res.status(200).json({
      message: 'Créneau modifié avec succès',
      calendrier: updatedCalendrier
    });
    
  } catch (err) {
    console.error('Erreur lors de la modification du créneau:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Erreur de validation',
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur serveur lors de la modification du créneau', 
      error: err.message 
    });
  }
};
const supprimerCreneau = async (req, res) => {
  try {
    const calendrierId = req.params.id;
    const creneauId = req.params.creneauId;

    // 1. Trouver le calendrier
    const calendrier = await CalendrierTravail.findById(calendrierId);
    if (!calendrier) {
      return res.status(404).json({ message: 'Calendrier non trouvé' });
    }

    // 2. Vérifier le créneau
    const creneau = calendrier.creneaux.id(creneauId);
    if (!creneau) {
      return res.status(404).json({ message: 'Créneau non trouvé' });
    }

    // 3. Validation: Empêcher suppression des créneaux choisis
    if (creneau.choisiParHabitant) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer un créneau déjà choisi' 
      });
    }

    // 4. Supprimer le créneau
    creneau.deleteOne();
    
    // 5. Mettre à jour le statut si nécessaire
    if (calendrier.creneaux.length === 0) {
      calendrier.statut = 'en_attente_creneaux';
    }

    // 6. Sauvegarder les modifications
    const updatedCalendrier = await calendrier.save();

    res.status(200).json({
      message: 'Créneau supprimé avec succès',
      calendrier: updatedCalendrier,
      creneauSupprime: creneauId
    });
    
  } catch (err) {
    console.error('Erreur lors de la suppression du créneau:', err);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la suppression du créneau', 
      error: err.message 
    });
  }
};
module.exports = {
  ajouterCreneau,
  choisirCreneau,
  getCalendrierByDevisId,
  getCreneauxByCalendrierId,
  modifierCreneau,
  supprimerCreneau 
};
