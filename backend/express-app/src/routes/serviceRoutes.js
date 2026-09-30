const express = require("express");
const authenticate = require("../middleware/authenticate");
const controller = require("../controllers/serviceController");

const router = express.Router();

router.use(authenticate);

router.post("/", controller.createService);
router.get("/", controller.getServices);
router.get("/:id", controller.getService);
router.put("/:id", controller.updateService);
router.delete("/:id", controller.deleteService);

module.exports = router;
