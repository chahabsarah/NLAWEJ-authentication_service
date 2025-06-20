const GlobalNotification = require('../models/globalNotificationModel');
const User = require('../models/User');


const create = async (req, res) => {
  try {
    const { title, message, priority, targetRoles, expiresAt, link } = req.body;

    const notification = new GlobalNotification({
      title,
      message,
      priority,
      targetRoles: targetRoles || ['admin', 'artisan', 'habitant'],
      expiresAt,
      link
    });

    await notification.save();

    // Émettre la notification aux utilisateurs connectés
    const io = req.app.get('io');
    const connectedUsers = io.sockets.sockets;

    if (io) {
      // Trouver les utilisateurs ayant les rôles cibles
      const users = await User.find({ role: { $in: notification.targetRoles } });
      
      users.forEach(user => {
        const userSocketId = Array.from(io.sockets.sockets.keys()).find(
          socketId => io.sockets.sockets.get(socketId).userId === user._id.toString()
        );
        
        if (userSocketId) {
          io.to(userSocketId).emit("receivenotif", notification);
        }
      });
    }

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la notification',
      error: error.message
    });
  }
};

 const list =async (req, res) => {
    try {
      const notifications = await GlobalNotification.find().sort('-createdAt');
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications',
        error: error.message
      });
    }
  };

 const listForUser = async (req, res) => {
    try {
          const userId = req.query.userId;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      const query = {
        $and: [
          { targetRoles: user.role },
          { readBy: { $ne: userId } },
          { 
            $or: [
              { expiresAt: { $exists: false } },
              { expiresAt: { $gt: new Date() } }
            ]
          }
        ]
      };

      const notifications = await GlobalNotification.find(query)
        .sort('-createdAt')
        .limit(50);

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications',
        error: error.message
      });
    }
  };

 const markAsRead = async (req, res) => {
    try {
      const { notificationId } = req.params;
    const userId = req.query.userId;

      const notification = await GlobalNotification.findById(notificationId);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification non trouvée'
        });
      }

      // Vérifier si l'utilisateur a déjà marqué cette notification comme lue
      if (!notification.readBy.includes(userId)) {
        notification.readBy.push(userId);
        await notification.save();
      }

      res.json({
        success: true,
        message: 'Notification marquée comme lue'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la notification',
        error: error.message
      });
    }
  };

 const deleteNotification = async (req, res) => {
    try {
      const { notificationId } = req.params;

      await GlobalNotification.findByIdAndDelete(notificationId);

      res.json({
        success: true,
        message: 'Notification supprimée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la notification',
        error: error.message
      });
    }
  }

module.exports = {deleteNotification,markAsRead,listForUser,create,list}