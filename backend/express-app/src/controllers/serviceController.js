const { validId, validBody } = require("../services/inputValidation");
const serviceRepository = require("../services/serviceRepository");

const billingCycles = ["monthly", "quarterly", "yearly", "one_time"];
const statuses = ["active", "inactive"];

function validateService(body) {
  const name =
    typeof body.name === "string" ? body.name.trim() : "";

  const categoryId = validId(body.category_id);
  const cost = Number(body.cost);

  if (name.length < 2 || name.length > 80) {
    return "Service name must be between 2 and 80 characters.";
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return "A valid category is required.";
  }

  if (!["string", "number"].includes(typeof body.cost) ||
      !/^\d+(\.\d{1,2})?$/.test(String(body.cost)) ||
      !Number.isFinite(cost) || cost <= 0 || cost > 1000000) {
    return "Cost must be greater than 0 and no more than 1000000, with at most two decimal places.";
  }

  if (!billingCycles.includes(body.billing_cycle)) {
    return "Invalid billing cycle.";
  }

  if (!statuses.includes(body.status)) {
    return "Invalid status.";
  }

  if (
    typeof body.renewal_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.renewal_date)
  ) {
    return "Renewal date must use YYYY-MM-DD format.";
  }

  const date = new Date(`${body.renewal_date}T00:00:00.000Z`);
  if (body.renewal_date < "1000-01-01" || Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== body.renewal_date) {
    return "Renewal date must be a valid calendar date.";
  }

  if (body.notes !== undefined && typeof body.notes !== "string") {
    return "Notes must be text.";
  }

  if ((body.notes || "").length > 500) {
    return "Notes cannot exceed 500 characters.";
  }

  return null;
}

function serviceData(body) {
  return {
    category_id: validId(body.category_id),
    name: body.name.trim(),
    cost: Number(body.cost),
    billing_cycle: body.billing_cycle,
    renewal_date: body.renewal_date,
    status: body.status,
    notes: body.notes ? body.notes.trim() : "",
  };
}

async function createService(req, res) {
  try {
    if (!validBody(req.body)) return res.status(400).json({ message: "A JSON object is required." });
    const validationError = validateService(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const data = serviceData(req.body);

    const ownsCategory =
      await serviceRepository.categoryBelongsToUser(
        req.user.id,
        data.category_id
      );

    if (!ownsCategory) {
      return res.status(400).json({
        message: "Category does not exist or does not belong to this user.",
      });
    }

    const service = await serviceRepository.createService(
      req.user.id,
      data
    );

    return res.status(201).json(service);
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "Category or user no longer exists." });
    }
    return res.status(500).json({
      message: "Unable to create service.",
    });
  }
}

async function getServices(req, res) {
  try {
    const filters = {};
    for (const key of ["search", "status", "category_id", "billing_cycle"]) {
      const value = req.query[key];
      if (value === undefined) continue;
      if (typeof value !== "string") return res.status(400).json({ message: `Invalid ${key} filter.` });
      if (key === "search") {
        if (value.length > 200) return res.status(400).json({ message: "Search must be 200 characters or fewer." });
        filters.search = value.trim();
      } else if (key === "category_id") {
        if (!validId(value)) return res.status(400).json({ message: "Invalid category filter." });
        filters.category_id = validId(value);
      } else {
        if (!(key === "status" ? statuses : billingCycles).includes(value)) {
          return res.status(400).json({ message: `Invalid ${key} filter.` });
        }
        filters[key] = value;
      }
    }
    const services = await serviceRepository.getServices(req.user.id, filters);
    return res.json(services);
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "Category or user no longer exists." });
    }
    return res.status(500).json({
      message: "Unable to retrieve services.",
    });
  }
}

async function getService(req, res) {
  try {
    const serviceId = validId(req.params.id);

    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      return res.status(400).json({ message: "Invalid service ID." });
    }

    const service = await serviceRepository.getServiceById(
      req.user.id,
      serviceId
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    return res.json(service);
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "Category or user no longer exists." });
    }
    return res.status(500).json({
      message: "Unable to retrieve service.",
    });
  }
}

async function updateService(req, res) {
  try {
    if (!validBody(req.body)) return res.status(400).json({ message: "A JSON object is required." });
    const serviceId = validId(req.params.id);

    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      return res.status(400).json({ message: "Invalid service ID." });
    }

    const validationError = validateService(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const data = serviceData(req.body);

    const ownsCategory =
      await serviceRepository.categoryBelongsToUser(
        req.user.id,
        data.category_id
      );

    if (!ownsCategory) {
      return res.status(400).json({
        message: "Category does not exist or does not belong to this user.",
      });
    }

    const service = await serviceRepository.updateService(
      req.user.id,
      serviceId,
      data
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    return res.json(service);
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "Category or user no longer exists." });
    }
    return res.status(500).json({
      message: "Unable to update service.",
    });
  }
}

async function deleteService(req, res) {
  try {
    const serviceId = validId(req.params.id);

    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      return res.status(400).json({ message: "Invalid service ID." });
    }

    const deleted = await serviceRepository.deleteService(
      req.user.id,
      serviceId
    );

    if (!deleted) {
      return res.status(404).json({ message: "Service not found." });
    }

    return res.status(204).send();
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "Category or user no longer exists." });
    }
    return res.status(500).json({
      message: "Unable to delete service.",
    });
  }
}

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
};
