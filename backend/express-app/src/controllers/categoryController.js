const { validId, validBody } = require("../services/inputValidation");
const categoryRepository = require("../services/categoryRepository");

function validColor(color) {
  return typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color);
}

async function createCategory(req, res) {
  try {
    if (!validBody(req.body)) return res.status(400).json({ message: "A JSON object is required." });
    const name = typeof req.body.name === "string"
      ? req.body.name.trim()
      : "";

    const color = req.body.color === undefined ? "#8b8b8b" : req.body.color;

    if (name.length < 2 || name.length > 40) {
      return res.status(400).json({
        message: "Category name must be between 2 and 40 characters.",
      });
    }

    if (!validColor(color)) {
      return res.status(400).json({
        message: "Color must use #RRGGBB format.",
      });
    }

    const category = await categoryRepository.createCategory(
      req.user.id,
      name,
      color
    );

    return res.status(201).json(category);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "A category with this name already exists.",
      });
    }

    return res.status(500).json({
      message: "Unable to create category.",
    });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await categoryRepository.getCategories(req.user.id);
    return res.json(categories);
  } catch (_error) {
    return res.status(500).json({
      message: "Unable to retrieve categories.",
    });
  }
}

async function getCategory(req, res) {
  try {
    const categoryId = validId(req.params.id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    const category = await categoryRepository.getCategoryById(
      req.user.id,
      categoryId
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    return res.json(category);
  } catch (_error) {
    return res.status(500).json({
      message: "Unable to retrieve category.",
    });
  }
}

async function updateCategory(req, res) {
  try {
    if (!validBody(req.body)) return res.status(400).json({ message: "A JSON object is required." });
    const categoryId = validId(req.params.id);
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";
    const color = req.body.color;

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    if (name.length < 2 || name.length > 40) {
      return res.status(400).json({
        message: "Category name must be between 2 and 40 characters.",
      });
    }

    if (!validColor(color)) {
      return res.status(400).json({
        message: "Color must use #RRGGBB format.",
      });
    }

    const category = await categoryRepository.updateCategory(
      req.user.id,
      categoryId,
      name,
      color
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    return res.json(category);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "A category with this name already exists.",
      });
    }

    return res.status(500).json({
      message: "Unable to update category.",
    });
  }
}

async function deleteCategory(req, res) {
  try {
    const categoryId = validId(req.params.id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    const deleted = await categoryRepository.deleteCategory(
      req.user.id,
      categoryId
    );

    if (!deleted) {
      return res.status(404).json({ message: "Category not found." });
    }

    return res.status(204).send();
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message: "Category cannot be deleted because it is being used by a service.",
      });
    }

    return res.status(500).json({
      message: "Unable to delete category.",
    });
  }
}

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
