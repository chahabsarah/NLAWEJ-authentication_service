const express = require("express");
const router = express.Router();
const OffreController = require("../controllers/OffreController");
const { authenticateUserByJwt } = require('../middlewares/JWT');

router.get("/all",OffreController.getOffres);
router.get("/:id",OffreController.getOffreById);
router.post("/add",OffreController.upload.single("image"), OffreController.createOffre);
router.put("/update/:id",OffreController.upload.single("image"), OffreController.updateOffre);
router.delete("/delete/:id",OffreController.deleteOffre);
router.post("/:id/like",OffreController.toggleLike);


module.exports = router;
