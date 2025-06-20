
const path = require('path');
const multer = require('multer');
const Service = require('../models/Service');
const User = require('../models/User');
const Categorie = require('../models/Categorie');
const { default: mongoose } = require('mongoose');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/service-images");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Seuls les fichiers JPG, JPEG et PNG sont autorisés."));
    }
    cb(null, true);
  },
});
const addService = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Le champ name est requis" });
    }
    const serviceImage = req.file ? req.file.path : null;

    const newService = new Service({ name, serviceImage });
    await newService.save();

    res.status(201).json({ message: "Service ajouté avec succès", service: newService });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout du service", error });
  }
};
const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { name } = req.body;
    const serviceImage = req.file ? req.file.path : undefined;

    const updatedFields = { name };
    if (serviceImage) updatedFields.serviceImage = serviceImage;

    const updatedService = await Service.findByIdAndUpdate(serviceId, updatedFields, { new: true });

    if (!updatedService) {
      return res.status(404).json({ message: "Service introuvable" });
    }

    res.status(200).json({ message: "Service mis à jour avec succès", service: updatedService });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du service", error });
  }

};
const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const deletedService = await Service.findByIdAndDelete(serviceId);
    if (!deletedService) {
      return res.status(404).json({ message: "Service introuvable" });
    }

    res.status(200).json({ message: "Service supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du service", error });
  }
};
const assignServiceToArtisan = async (req, res) => {
    try {
        const { artisanId, serviceId } = req.body;

        // Vérifier si le service existe
        const service = await Service.findById(serviceId);
        console.log(service);
        if (!service) {
          return res.status(404).json({ message: 'Service introuvable' });
        }

        const artisan = await User.findById(artisanId);
        console.log(artisan);

        if (!artisan || artisan.role !== 'artisan') {
          return res.status(404).json({ message: "L'utilisateur n'est pas un artisan ou n'existe pas" });
        }

        if (!artisan.speciality.includes(serviceId)) {
          console.log(artisan.speciality);
          artisan.speciality.push(serviceId);
          console.log(service.name);
          await artisan.save({ validateModifiedOnly: true });
        }
        res.status(201).json({ message: 'Service assigné avec succès '});
      } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'assignation du service", error });
      }
};
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
   const updatedServices = services.map(service => ({
      ...service._doc, 
      serviceImage: service.serviceImage.replace(/\\/g, "/") 
    }));

    res.status(200).json(updatedServices);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des services", error });
  }
};
const getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await Service.findById(serviceId);

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};
const assignServicesToCategorie = async (req, res) => {
  try {
    const { categorieId, serviceIds } = req.body;

    if (!serviceIds) {
      return res.status(400).json({ message: "serviceIds requis." });
    }
    if (!categorieId ) {
      return res.status(400).json({ message: "categorieId requis." });
    }
    const servicesArray = Array.isArray(serviceIds) ? serviceIds : [serviceIds];

    // Vérifie les IDs
    const mongoose = require("mongoose");

    if (!mongoose.Types.ObjectId.isValid(categorieId)) {
      return res.status(400).json({ message: "categorieId invalide." });
    }

    const invalidIds = servicesArray.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ message: "Un ou plusieurs serviceIds sont invalides.", invalidIds });
    }

    const categorie = await Categorie.findById(categorieId);
    if (!categorie) {
      return res.status(404).json({ message: "Catégorie introuvable." });
    }

    const existingServices = await Service.find({ _id: { $in: servicesArray } });
    if (existingServices.length !== servicesArray.length) {
      return res.status(404).json({ message: "Un ou plusieurs services sont introuvables." });
    }

    const newServices = servicesArray.filter(
      id => !categorie.services.map(s => s.toString()).includes(id)
    );

    categorie.services.push(...newServices);
    await categorie.save();

    res.status(200).json({
      message: "Service(s) assigné(s) avec succès à la catégorie.",
      categorie,
    });
  } catch (error) {
    console.error("Erreur assignation service:", error);
    res.status(500).json({ message: "Erreur lors de l'assignation des services.", error: error.message || error });
  }
};
const removeServiceFromCategorie = async (req, res) => {
  try {
    const { categorieId, serviceIds } = req.body;

    // Vérification des champs requis
    if (!categorieId || !serviceIds) {
      return res.status(400).json({ message: "categorieId et serviceIds sont requis." });
    }

    const servicesArray = Array.isArray(serviceIds) ? serviceIds : [serviceIds];

    // Vérifie la validité des ObjectId
    if (!mongoose.Types.ObjectId.isValid(categorieId)) {
      return res.status(400).json({ message: "categorieId invalide." });
    }

    const invalidIds = servicesArray.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ message: "Un ou plusieurs serviceIds sont invalides.", invalidIds });
    }

    const categorie = await Categorie.findById(categorieId);
    if (!categorie) {
      return res.status(404).json({ message: "Catégorie introuvable." });
    }

    // Supprimer les services spécifiés de la liste
    categorie.services = categorie.services.filter(
      serviceId => !servicesArray.includes(serviceId.toString())
    );

    await categorie.save();

    res.status(200).json({
      message: "Service(s) supprimé(s) avec succès de la catégorie.",
      categorie,
    });
  } catch (error) {
    console.error("Erreur suppression service de catégorie:", error);
    res.status(500).json({ message: "Erreur lors de la suppression des services.", error: error.message || error });
  }
};
const getArtisansByService = async (req, res) => {
  try {
    const serviceId = req.params.serviceId;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }

    const artisans = await User.find({
      role: 'artisan',
      speciality: serviceId,
    });

    res.status(200).json(artisans);
  } catch (error) {
    console.error('Error fetching artisans by service:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const desassignServiceFromArtisan = async (req, res) => {
  try {
    const { artisanId, serviceId } = req.body;

    if (!artisanId || !serviceId) {
      return res.status(400).json({ message: "artisanId et serviceId sont requis." });
    }

    const artisan = await User.findById(artisanId);
    if (!artisan || artisan.role !== 'artisan') {
      return res.status(404).json({ message: "Artisan introuvable ou rôle invalide." });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service introuvable." });
    }
 console.log('serviceId',service._id)
    const index = artisan.speciality.indexOf(service._id);
    console.log('index',index)
    if (index > -1) {
      artisan.speciality.splice(index, 1);
      await artisan.save();
      return res.status(200).json({ message: "Service désassigné avec succès." });
    } else {
      return res.status(400).json({ message: "Ce service n'est pas assigné à cet artisan." });
    }
  } catch (error) {
    console.error("Erreur lors de la désassignation :", error);
    res.status(500).json({ message: "Erreur lors de la désassignation du service.", error: error.message });
  }
};



module.exports = { getServiceById };
module.exports = { addService, updateService, deleteService, assignServiceToArtisan,
   getAllServices,upload, getServiceById,assignServicesToCategorie,removeServiceFromCategorie,
  getArtisansByService,desassignServiceFromArtisan};
