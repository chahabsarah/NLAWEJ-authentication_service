const express = require("express");
const router = express.Router();
const ServiceController= require("../controllers/ServiceController");
const { upload, addService,updateService } = require("../controllers/ServiceController");

router.post("/add", upload.single("serviceImage"), addService);
router.put("/update/:serviceId", upload.single('serviceImage'),updateService);
router.delete("/delete/:serviceId", ServiceController.deleteService);
router.post("/assign", ServiceController.assignServiceToArtisan);
router.delete("/desassign", ServiceController.desassignServiceFromArtisan);
router.get("/services", ServiceController.getAllServices);
router.get("/:serviceId", ServiceController.getServiceById);
router.put('/assign-services-categorie', ServiceController.assignServicesToCategorie);
router.put('/remove-services-categorie', ServiceController.removeServiceFromCategorie);
router.get('/artisans-by-service/:serviceId', ServiceController.getArtisansByService);

module.exports = router;
