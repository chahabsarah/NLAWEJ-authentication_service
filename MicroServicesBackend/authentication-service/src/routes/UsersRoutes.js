const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const UserController = require('../controllers/UserManagement');
const { authenticateUserByJwt } = require('../middlewares/JWT');
const { checkAdminRole } = require('../middlewares/RoleMiddleware');
const { updateProfile } = require('../controllers/UserManagement');


router.get('/clients', UserController.getAllClients);//✅
router.get('/habitants', authenticateUserByJwt, checkAdminRole, UserController.getAllHabitants);//✅
router.get('/artisans', authenticateUserByJwt, checkAdminRole, UserController.getAllArtisans);//✅
router.get('/admins', authenticateUserByJwt, checkAdminRole, UserController.getAllAdmins);//✅
router.get('/user/:id', authenticateUserByJwt, UserController.getUserById);//✅
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = file.fieldname === 'cv' ? 'uploads/cvs' : 'uploads/profile-images';
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = {
      'cv': ['.pdf', '.doc', '.docx'],
      'profileImage': ['.jpg', '.jpeg', '.png']
    };
    const ext = path.extname(file.originalname).toLowerCase();
    const field = file.fieldname;
    if (!allowedExtensions[field] || !allowedExtensions[field].includes(ext)) {
      return cb(new Error(`Fichier non autorisé pour ${field}.`));
    }
    cb(null, true);
  }
});

router.put('/update', upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]), updateProfile);
router.put('/updateAccountStatus', authenticateUserByJwt, checkAdminRole, UserController.updateUserStatus);//✅
router.put('/updateByAdmin/:userId', authenticateUserByJwt, checkAdminRole, UserController.updateUserDataByAdmin);//✅

router.delete('/delete/:id', authenticateUserByJwt, checkAdminRole, UserController.deleteUser);//✅

router.get('/find/habitant/email', authenticateUserByJwt,UserController.findHabitantByEmail);//✅
router.get('/find/admin/email', authenticateUserByJwt, checkAdminRole, UserController.findAdminByEmail);//✅
router.get('/find/artisan/email',authenticateUserByJwt, UserController.findArtisanByEmail);//✅

router.get('/find/admin/phone', authenticateUserByJwt, checkAdminRole, UserController.findAdminByPhone);//✅
router.get('/find/admin/address',  authenticateUserByJwt, checkAdminRole,UserController.findAdminByAddress);//✅
router.get('/find/habitant/phone',authenticateUserByJwt, UserController.findHabitantByPhone);//✅
router.get('/find/habitant/address',authenticateUserByJwt, UserController.findHabitantByAddress);//✅
router.get('/find/artisan/phone', authenticateUserByJwt,UserController.findArtisanByPhone);//✅
router.get('/find/artisan/address',authenticateUserByJwt, UserController.findArtisanByAddress);//✅

router.get('/find/user/phone',authenticateUserByJwt, UserController.findUserByPhone);//✅
router.get('/find/user/address',authenticateUserByJwt, UserController.findUserByAddress);//✅

router.get('/find/role', authenticateUserByJwt,UserController.findUserByRole);//✅
//waiting for speciality model to be build
router.get('/find/artisan/speciality',authenticateUserByJwt, UserController.findArtisansBySpeciality);
router.get('/find/artisan/criteria',authenticateUserByJwt, UserController.findArtisansByCritria);
router.get('/speciality/:speciality',authenticateUserByJwt, UserController.getArtisansBySpeciality);

router.post('/:habitantId/favorites/add',authenticateUserByJwt, UserController.addFavoriteArtisan);//✅
router.delete('/favorites/remove',authenticateUserByJwt, UserController.removeFavoriteArtisan);//✅
router.get('/:habitantId/favorites', authenticateUserByJwt,UserController.getFavoriteArtisans);//✅

module.exports = router;
