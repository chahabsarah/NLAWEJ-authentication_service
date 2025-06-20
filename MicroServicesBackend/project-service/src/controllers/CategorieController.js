const Categorie = require("../models/Categorie");


const createCategorie = async (req, res) => {
  try {
    const { nom, services } = req.body;

    const existing = await Categorie.findOne({ nom });
    if (existing) {
      return res.status(400).json({ message: "Cette catégorie existe déjà" });
    }

    const categorie = new Categorie({ nom, services });
    await categorie.save();
    res.status(201).json(categorie);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création", error });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Categorie.find().populate('services');
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération", error });
  }
};

const getCategorieById = async (req, res) => {
  try {
    const categorie = await Categorie.findById(req.params.id).populate('services');
    if (!categorie) {
      return res.status(404).json({ message: "Catégorie non trouvée" });
    }
    res.status(200).json(categorie);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération", error });
  }
};

const updateCategorie = async (req, res) => {
  try {
    const { nom, services } = req.body;

    const updated = await Categorie.findByIdAndUpdate(
      req.params.id,
      { nom, services },
      { new: true }
    ).populate('services');

    if (!updated) {
      return res.status(404).json({ message: "Catégorie non trouvée" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour", error });
  }
};

const deleteCategorie = async (req, res) => {
  try {
    const deleted = await Categorie.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Catégorie non trouvée" });
    }
    res.status(200).json({ message: "Catégorie supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error });
  }
};
const getServicesByCategorieById = async (req, res) => {
  try {
    const categorie = await Categorie.findById(req.params.id).populate("services");
    
    if (!categorie) {
      return res.status(404).json({ message: "Catégorie non trouvée" });
    }

    res.status(200).json(categorie.services); // renvoie les services avec détails
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération", error });
  }
};


module.exports = {
  createCategorie,
  getAllCategories,
  getCategorieById,
  updateCategorie,
  deleteCategorie,
  getServicesByCategorieById
};
