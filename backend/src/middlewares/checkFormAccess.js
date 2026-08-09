const Form = require("../models/Form");
const checkResourceAccess = require("./checkResourceAccess");

const gate = checkResourceAccess(Form);

// Thin wrapper kept for existing Form routes/controllers, which read
// req.formDoc. Interface unchanged — form.routes.js, form.controller.js
// me kuch update nahi karna padega.
const checkFormAccess = (options) => gate({ ...options, docAlias: "formDoc" });

module.exports = checkFormAccess;