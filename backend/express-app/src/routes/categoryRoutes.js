const express = require("express");
const authenticate = require("../middleware/authenticate");
const controller = require("../controllers/categoryController");

const router = express.Router();

router.use(authenticate);

router.post("/", controller.createCategory);
router.get("/", controller.getCategories);
router.get("/:id", controller.getCategory);
router.put("/:id", controller.updateCategory);
router.delete("/:id", controller.deleteCategory);

module.exports = router;
