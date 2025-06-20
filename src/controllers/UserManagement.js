require('dotenv').config();
const { default: mongoose } = require('mongoose');
const User = require('../models/User');
const Service = require('../models/Service');

const getAllHabitants = async (req, res) => {
  try {
    const clients = await User.find({ role: 'habitant' });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};
const getAllArtisans = async (req, res) => {
  try {
    const clients = await User.find({ role: 'artisan' });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};
const getAllClients = async (req, res) => {
  try {
    const clients = await User.find({ role: { $in: ['habitant', 'artisan'] } });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({role: 'admin'});
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('speciality');
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving user' });
  }
};
const updateProfile = async (req, res) => {
  try {
    console.log("req.body :", req.body);
    console.log("req.files :", req.files);

    const { userId, fullName, address, phone, speciality, tarif, bio, instaLink, linkedInLink, gitLink, fbLink } = req.body;

    const updatedData = {};

    if (fullName) updatedData.fullName = fullName;
    if (address) updatedData.address = address;
    if (phone) updatedData.phone = phone;
    if (req.files?.profileImage) updatedData.profileImage = req.files.profileImage[0].path;
    if (req.files?.cv) updatedData.cv = req.files.cv[0].path;
    if (speciality) updatedData.speciality = speciality;
    if (tarif) updatedData.tarif = tarif;
    if (bio) updatedData.bio = bio;
    if (instaLink) updatedData.instaLink = instaLink;
    if (linkedInLink) updatedData.linkedInLink = linkedInLink;
    if (gitLink) updatedData.gitLink = gitLink;
    if (fbLink) updatedData.fbLink = fbLink;

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ message: 'No valid data provided for update.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateUserDataByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    const { 
      fullName, 
      address, 
      phone, 
      email,
      role,
      accountStatus,
      speciality,
      tarif,
      bio,
      instaLink,
      linkedInLink,
      gitLink,
      fbLink,
      preferences,
      favoriteArtisans,
      cv
    } = req.body;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Admin privileges required' });
    }
    const user = await User.findById(userId);
    if (!user ) {
      return res.status(403).json({ message: 'not found' });
    }
    const updateFields = [
      fullName, address, phone, email, role, accountStatus,
      speciality, tarif, bio, instaLink, linkedInLink, gitLink, fbLink,
      preferences, favoriteArtisans, cv, req.files?.profileImage, req.files?.cv
    ].filter(field => field !== undefined);

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No data provided for update' });
    }

    const updatedData = {};
    
    // Common fields for all roles
    if (fullName) updatedData.fullName = fullName;
    if (address) updatedData.address = address;
    if (phone) updatedData.phone = phone;
    if (email) updatedData.email = email;
    if (req.files?.profileImage) updatedData.profileImage = req.files.profileImage[0].path;
    
    // Role-specific fields
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    switch(targetUser.role) {
      case 'artisan':
        if (speciality) updatedData.speciality = Array.isArray(speciality) ? 
          speciality : speciality.split(',').map(s => s.trim());
        if (tarif) updatedData.tarif = tarif;
        if (cv) updatedData.cv = cv;
        if (req.files?.cv) updatedData.cv = req.files.cv[0].path;
        break;
        
      case 'habitant':
        if (preferences) updatedData.preferences = Array.isArray(preferences) ? 
          preferences : preferences.split(',').map(p => p.trim());
        if (favoriteArtisans) {
          const validArtisans = await User.find({
            _id: { $in: favoriteArtisans },
            role: 'artisan'
          });
          if (validArtisans.length !== favoriteArtisans.length) {
            return res.status(400).json({ message: 'One or more invalid artisan IDs' });
          }
          updatedData.favoriteArtisans = favoriteArtisans;
        }
        break;

    }

    // Social links and bio (common but optional)
    if (bio) updatedData.bio = bio;
    if (instaLink) updatedData.instaLink = instaLink;
    if (linkedInLink) updatedData.linkedInLink = linkedInLink;
    if (gitLink) updatedData.gitLink = gitLink;
    if (fbLink) updatedData.fbLink = fbLink;

    // Admin-only fields
    if (role) updatedData.role = role;
    if (accountStatus) updatedData.accountStatus = accountStatus;

    // Perform update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedData },
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    ).select('-password -refreshToken -verificationCode');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User update failed' });
    }

    return res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Admin update error:', error);
    
    // Handle specific errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    
    return res.status(500).json({ message: 'Server error during admin update' });
  }
};

const updateUserStatus= async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send('user not found');
    }
    const email = req.body.email;
    const userToUpdate = await User.findOne({ email });
    const newAccountStatus = req.body.newAccountStatus;
    userToUpdate.AccountStatus = newAccountStatus;
    await userToUpdate.save();
    res.status(200).send('AccountStatus updated!');
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting user' });
  }
};

const findHabitantByEmail = async (req, res) => {
    try {
        const { email } = req.body;

      const user = await User.findOne({ email, role: 'habitant' });
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };
const findAdminByEmail= async (req, res) => {
    try {
        const { email } = req.body;
          const user = await User.findOne({ email, role: 'admin' });
      if (!user) {
        return res.status(404).json({ user});

      }
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };
const findArtisanByEmail= async (req, res) => {
    try {
        const { email } = req.body;

      const user = await User.findOne({ email, role: 'artisan' });
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };
const findAdminByPhone = async (req, res) => {
    try {
        const { phone} = req.body;

      const user = await User.findOne({ phone, role: 'admin' });
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };
const findAdminByAddress = async (req, res) => {
    try {
        const { address} = req.body;

      const user = await User.findOne({ address , role: 'admin' });
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };
const findHabitantByPhone = async (req, res) => {
    try {
        const { phone} = req.body;

      const user = await User.findOne({ phone , role: 'habitant' });
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };
const findHabitantByAddress = async (req, res) => {
    try {
        const { address} = req.body;

      const user = await User.findOne({ address , role: 'habitant' });
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };

const findArtisanByPhone = async (req, res) => {
    try {
        const { phone} = req.body;

      const user = await User.findOne({ phone , role: 'artisan' });
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };
const findArtisanByAddress = async (req, res) => {
    try {
        const { address} = req.body;

      const user = await User.findOne({ address , role: 'artisan' });
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };
const findUserByPhone = async (req, res) => {
    try {
        const { phone} = req.body;

      const user = await User.findOne({ phone });
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };
const findUserByAddress = async (req, res) => {
    try {
        const { address} = req.body;

      const user = await User.findOne({ address });
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };
const findUserByRole = async (req, res) => {
    try {
        const { role} = req.body;

      const users = await User.find({ role });
      return res.status(200).json({ users});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };
const findArtisansBySpeciality = async (req, res) => {
    try {
        const { speciality} = req.body;

      const user = await User.find({ speciality, role: 'artisan' });
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
  };
const getArtisansBySpeciality = async (req, res) => {
  try {
    const { speciality } = req.params;

    if (!speciality) {
      return res.status(400).json({ message: 'Spécialité requise' });
    }

    const artisans = await User.find({ speciality: speciality });

    if (artisans.length === 0) {
      return res.status(404).json({ message: 'Aucun artisan trouvé pour cette spécialité' });
    }

    res.status(200).json(artisans);
  } catch (error) {
    console.error('Erreur dans getArtisansBySpeciality:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
const findArtisansByCritria = async (req, res) => {
    try {
        const { address, tarif, speciality} = req.body;

      const user = await User.find({ address,
        tarif: { $gt: tarif - 6
            , $lt: tarif + 6},speciality,
        role: 'artisan' });
      return res.status(200).json({ user});
    }
    catch (error) {
        console.error('Erreur lors de la recherche :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
      }
};

const addFavoriteArtisan = async (req, res) => {
  try {
    const {habitantId} = req.params;
    const {artisanId } = req.body;
    const user = await User.findById(habitantId);
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
        if (user.role !== 'habitant') {
      return res.status(400).json({ message: "Seul un habitant peut ajouter des artisans favoris" });
    }

    const artisan = await User.findById(artisanId);
    if (!artisan || artisan.role ==! 'artisan' ) {
      return res.status(404).json({ message: "Artisan non trouvé ou role n'est pas artisan!" });
    }

    if (artisan.id in user.favoriteArtisans) {
      return res.status(400).json({ message: "Cet artisan est déjà dans la liste des favoris" });
    }

    user.favoriteArtisans.push(artisanId);
    await user.save();

    res.status(201).json({ 
      message: "Artisan ajouté aux favoris", 
      favoriteArtisans: user.favoriteArtisans 
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'artisan:", error);
    res.status(500).json({ 
      message: "Erreur lors de l'ajout de l'artisan aux favoris", 
      error: error.message || error 
    });
  }
};

const removeFavoriteArtisan = async (req, res) => {
    try {
      const { habitantId, artisanId } = req.body;
  
      const habitant = await User.findById(habitantId);
      if (!habitant || habitant.role !== "habitant") {
        return res.status(400).json({ message: "Seul un habitant peut gérer ses favoris" });
      }
  
      const index = habitant.favoriteArtisans.indexOf(artisanId);
      if (index === -1) {
        return res.status(404).json({ message: "Cet artisan n'est pas dans la liste des favoris" });
      }
  
      habitant.favoriteArtisans.splice(index, 1);
      await habitant.save({ validateModifiedOnly: true });
  
      res.status(200).json({ message: "Artisan supprimé des favoris", favoriteArtisans: habitant.favoriteArtisans });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'artisan des favoris", error });
    }
};
const getFavoriteArtisans = async (req, res) => {
    try {
      const { habitantId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(habitantId)) {
        return res.status(400).json({ message: "ID invalide" });
      }

      // On utilise directement le modèle Habitant
      const habitant = await User.findById(habitantId)
        .populate({
          path: 'favoriteArtisans',
        });

      if (!habitant) {
        return res.status(404).json({ 
          message: "Habitant non trouvé ou ID ne correspond pas à un habitant" 
        });
      }

      res.status(200).json({ 
        favoriteArtisans: habitant.favoriteArtisans || [],
        count: habitant.favoriteArtisans?.length || 0
      });
    } catch (error) {
      console.error("Erreur:", error);
      res.status(500).json({ 
        message: "Erreur serveur", 
        error: error.message 
      });
    }
};
module.exports = {getUserById,getAllClients,getAllAdmins,
  updateProfile, updateUserStatus, updateUserDataByAdmin, deleteUser,
findHabitantByEmail,findAdminByEmail,findArtisanByEmail,
findAdminByPhone,findAdminByAddress,findHabitantByPhone, findHabitantByAddress, 
findArtisanByAddress, findArtisanByPhone ,findUserByAddress, findUserByPhone,
findArtisansBySpeciality,findUserByRole,findArtisansByCritria,
addFavoriteArtisan,removeFavoriteArtisan,getFavoriteArtisans,getArtisansBySpeciality,
getAllArtisans,getAllHabitants};
