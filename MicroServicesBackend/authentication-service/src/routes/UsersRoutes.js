const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const UserController = require('../controllers/UserManagement');
const { authenticateUserByJwt } = require('../middlewares/JWT');
const { checkAdminRole } = require('../middlewares/RoleMiddleware');

// Routes d'administration
router.get('/clients', UserController.getAllClients);
router.get('/habitants', authenticateUserByJwt, checkAdminRole, UserController.getAllHabitants);
router.get('/artisans', authenticateUserByJwt, checkAdminRole, UserController.getAllArtisans);
router.get('/admins', authenticateUserByJwt, checkAdminRole, UserController.getAllAdmins);
router.get('/user/:id', authenticateUserByJwt, UserController.getUserById);

// Upload Configuration (externe recommandée)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'cv' ? 'uploads/cvs' : 'uploads/profile-images';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    cb(null, `${Date.now()}-${safeName}`);
  }
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowed = {
      'cv': ['.pdf', '.doc', '.docx'],
      'profileImage': ['.jpg', '.jpeg', '.png']
    };
    const ext = path.extname(file.originalname).toLowerCase();
    const field = file.fieldname;
    if (!allowed[field] || !allowed[field].includes(ext)) {
      return cb(new Error(`Fichier non autorisé pour ${field}.`));
    }
    cb(null, true);
  }
});
router.put('/update', upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]), UserController.updateProfile);

// Update et suppression
router.put('/updateAccountStatus', authenticateUserByJwt, checkAdminRole, UserController.updateUserStatus);
router.put('/updateByAdmin/:userId', authenticateUserByJwt, checkAdminRole, UserController.updateUserDataByAdmin);
router.delete('/delete/:id', authenticateUserByJwt, checkAdminRole, UserController.deleteUser);

//  Routes dynamiques pour recherche par champ
const roleFieldMap = {
  habitant: ['email', 'phone', 'address'],
  artisan: ['email', 'phone', 'address', 'speciality'],
  admin: ['email', 'phone', 'address'],
  user: ['phone', 'address']
};
for (const [role, fields] of Object.entries(roleFieldMap)) {
  fields.forEach(field => {
    const route = `/find/${role}/${field}`;
    const handler = UserController[`find${capitalize(role)}By${capitalize(field)}`];
    if (handler) {
      router.get(route, authenticateUserByJwt, (role === 'admin' ? checkAdminRole : (req, res, next) => next()), handler);
    }
  });
}
router.get('/find/role', authenticateUserByJwt, UserController.findUserByRole);
router.get('/find/artisan/criteria', authenticateUserByJwt, UserController.findArtisansByCritria);
router.get('/speciality/:speciality', authenticateUserByJwt, UserController.getArtisansBySpeciality);

// Favoris
router.post('/:habitantId/favorites/add', authenticateUserByJwt, UserController.addFavoriteArtisan);
router.delete('/favorites/remove', authenticateUserByJwt, UserController.removeFavoriteArtisan);
router.get('/:habitantId/favorites', authenticateUserByJwt, UserController.getFavoriteArtisans);

// Utilitaire : pour générer dynamiquement les noms de méthodes
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = router;
