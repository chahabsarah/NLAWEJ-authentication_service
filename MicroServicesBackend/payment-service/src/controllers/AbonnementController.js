const User = require('../models/User');
const Abonnement = require('../models/Abonnement');

exports.getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier si l'utilisateur existe et récupérer l'abonnement
    const user = await User.findById(userId)
      .populate({
        path: 'subscription',
        select: 'periode montant dateDebut dateFin statut createdAt'
      })
      .select('hasSubscription subscription role');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    // Vérifier si l'utilisateur est un artisan
    if (user.role !== 'artisan') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les artisans peuvent avoir des abonnements'
      });
    }

    // Vérifier si l'utilisateur a un abonnement
    if (!user.hasSubscription || !user.subscription) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement trouvé pour cet utilisateur'
      });
    }

    // Formater la réponse
    const subscriptionData = {
      ...user.subscription._doc,
      joursRestants: calculateRemainingDays(user.subscription.dateFin)
    };

    res.status(200).json({
      success: true,
      subscription: subscriptionData
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Fonction utilitaire pour calculer les jours restants
function calculateRemainingDays(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Conversion en jours
}
exports.checkCanProposeDevis = async (userId) => {
  const user = await User.findById(userId)
    .populate('subscription')
    .select('role hasSubscription subscription');
  
  if (!user || user.role !== 'artisan') return false;
  if (!user.hasSubscription || !user.subscription) return false;
  
  const now = new Date();
  return (
    user.subscription.statut === 'actif' &&
    new Date(user.subscription.dateDebut) <= now &&
    new Date(user.subscription.dateFin) >= now
  );
};
exports.getSubscriptionById = async (req, res) => {
  try {
    const {subId} =req.params;
    const abonnement = await Abonnement.findById(subId).populate('artisan');
    if (!abonnement) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }
    res.status(200).json(abonnement);
  } catch (err) {
    console.error('Erreur lors de la récupération de l’abonnement :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

