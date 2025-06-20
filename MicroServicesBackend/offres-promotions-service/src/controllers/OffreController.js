const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Offre = require("../models/Offre");
const Comment = require("../models/Comment");
const Service = require('../models/Service'); 
const Location = require('../models/Location'); 
const globalNotificationModel = require("../models/globalNotificationModel");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/offres-images");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".avif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Seuls les fichiers JPG, JPEG et PNG sont autorisés."));
    }
    cb(null, true);
  },
});
const getOffres = async (req, res) => {
  try {
    console.log("Fetching offres...");
    
    const offres = await Offre.find()
      .populate('service')
      .populate('location')
      .sort({ createdAt: -1 });

    console.log("Offres récupérées:", offres);

    const updatedOffres = offres.map(offre => ({
      ...offre._doc,
      offreImage: offre.image ? offre.image.replace(/\\/g, "/") : null
    }));

    res.status(200).json(updatedOffres);
  } catch (error) {
    console.error("Erreur lors de la récupération des Offres:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des Offres",
      error: error.message || error
    });
  }
};

const getOffreById = async (req, res) => {
  try {
        const { id } = req.params;
        const offre = await Offre.findById(id);
        res.status(200).json(offre);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de Offre", error });
  }
};

const createOffre = async (req, res) => {
  try {
    const { title, description, service, location, artisan, duration } = req.body;
    const imagePath = req.file ? req.file.path : null;

    if (!service) {
      return res.status(400).json({ msg: "Le champ 'service' est requis." });
    }

    // Créer la nouvelle offre
    const newOffer = new Offre({
      title,
      description,
      image: imagePath,
      service,
      artisan,
      location,
      duration,
    });

    await newOffer.save();

    // Créer la notification globale
    const notification = new globalNotificationModel({
      title: "Nouvelle offre disponible!",
      message: `Une nouvelle offre "${title}" a été ajoutée par ${artisan}.`,
      targetRoles: ['habitant'],
      priority: 'high',
      link: `/offres/${newOffer._id}`
    });

    await notification.save();

    // Émettre la notification via Socket.IO
    const io = req.app.get('socketio');
    
    if (io) {
      // Solution 1: Trouver tous les utilisateurs avec le rôle 'habitant'
      try {
        const habitants = await User.find({ role: 'habitant' });
        const habitantsSockets = Array.from(io.sockets.sockets.values())
          .filter(socket => habitants.some(h => h._id.toString() === socket.userId));
          
         habitantsSockets.forEach(socket => {
  socket.emit('new-offre-notification', {
              notification: {
                _id: notification._id,
                title: notification.title,
                message: notification.message,
                link: notification.link,
                createdAt: notification.createdAt,
                priority: notification.priority
              },
              offer: {
                _id: newOffer._id,
                title: newOffer.title,
                artisan: newOffer.artisan,
                service: newOffer.service
              }
            });
            console.log(`Notification envoyée à l'habitant ${habitant._id}`);
          }
        );

        // Solution alternative: Émettre à tous (pour debug)
        io.emit('new-offre-notification', {
          notification: {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            createdAt: notification.createdAt,
            priority: notification.priority
          },
          offer: {
            _id: newOffer._id,
            title: newOffer.title,
            artisan: newOffer.artisan,
            service: newOffer.service
          }
        });

        console.log('Notification diffusée via Socket.IO');
      } catch (socketError) {
        console.error('Erreur lors de l\'émission Socket.IO:', socketError);
      }
    } else {
      console.warn('Socket.IO non disponible');
    }

    res.status(201).json({
      success: true,
      data: newOffer,
      message: 'Offre créée avec succès et notification envoyée'
    });

  } catch (err) {
    console.error('Erreur createOffre:', err);
    res.status(500).json({ 
      success: false,
      msg: 'Erreur lors de la création de l\'offre.',
      error: err.message 
    });
  }
};

const updateOffre = async (req, res) => {
    try {

      const { title, description, category, location , duration} = req.body;
      let updatedData = { title, description, category, location,duration};
      if (req.file) {
        const newImagePath = req.file.path.replace(/\\/g, "/");
        const offre = await Offre.findById(req.params.id);
        if (offre && offre.image && fs.existsSync(offre.image)) {
          fs.unlinkSync(offre.image);
        }
        updatedData.image = newImagePath;
      }
      const updatedOffre = await Offre.findByIdAndUpdate(req.params.id, updatedData, { new: true });
      if (!updatedOffre) return res.status(404).json({ message: "Offre non trouvé" });

      res.json({ message: "Offre mis à jour avec succès", offre: updatedOffre });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de Offre", error });
    }
  };
const deleteOffre = async (req, res) => {
  try {
    const offre = await Offre.findById(req.params.id);
    if (!offre) return res.status(404).json({ message: "Offre non trouvé" });

    if (offre.image) {
      fs.unlinkSync(offre.image);
    }

    await Offre.findByIdAndDelete(req.params.id);
    res.json({ message: "Offre supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de Offre", error });
  }
};
const toggleLike = async (req, res) => {
 try {
  const {id} = req.params;
  const {userId} = req.body;
    const offre = await Offre.findById(id);
    if (!offre) {
      return res.status(404).json({ message: "Offre not found" });
    }

    await offre.toggleLike(userId);
    const updatedOffre = await Offre.findById(id)
      .populate('likes', 'fullName profileImage')

    res.status(200).json(updatedOffre);
  } catch (error) {
    res.status(500).json({ message: "Error toggling like", error });
  }
};


module.exports = { getOffres, getOffreById, createOffre, updateOffre, deleteOffre, upload,toggleLike};
