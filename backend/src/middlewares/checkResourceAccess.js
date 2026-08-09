const asyncHandler = require("../helpers/asyncHandler");
const ApiError = require("../helpers/ApiError");

/**
 * Generic per-document role gate — works for ANY Mongoose model that
 * has an `accessControl: { <accessKey>: [roles] }` shape. Form,
 * Syllabus, and any future publishable resource all share this, so a
 * brand-new module never needs its own access-check middleware.
 *
 * docAlias (optional): also attaches the doc under req[docAlias], for
 * backward compatibility with controllers written against a specific
 * name (e.g. req.formDoc).
 */
const checkResourceAccess = (Model) => ({
  accessKey,
  lookupField,
  lookupBy = "slug",
  extraFilter = {},
  docAlias,
}) =>
  asyncHandler(async (req, res, next) => {
    const identifier = req.params[lookupField];

    if (!identifier) {
      throw new ApiError(400, `Missing ${lookupField} in request`);
    }

    const query = {
      ...(lookupBy === "_id" ? { _id: identifier } : { [lookupBy]: identifier }),
      ...extraFilter,
    };

    const doc = await Model.findOne(query).lean();

    if (!doc) {
      throw new ApiError(404, "Not found");
    }

    const requiredRoles = doc.accessControl?.[accessKey] || [];

    if (requiredRoles.length === 0) {
      req.resourceDoc = doc;
      if (docAlias) req[docAlias] = doc;
      return next();
    }

    if (!req.user) {
      throw new ApiError(401, "You must be logged in to access this");
    }

    if (!requiredRoles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to access this");
    }

    req.resourceDoc = doc;
    if (docAlias) req[docAlias] = doc;
    next();
  });

module.exports = checkResourceAccess;