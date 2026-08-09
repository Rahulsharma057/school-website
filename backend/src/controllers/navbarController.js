const Navbar = require("../models/Navbar");

const uploadToCloudinary = require("../utils/uploadToCloudinary");
const deleteFromCloudinary = require("../utils/deleteFromCloudinary");

// =========================================
// CREATE / UPDATE NAVBAR
// =========================================

exports.createNavbar = async (req, res) => {
  try {
    let navbar = await Navbar.findOne();

    if (!navbar) {
      navbar = new Navbar();
    }

    // =========================================
    // DESIGN SETTINGS
    // =========================================

    const fields = [
      // =========================
      // BASIC INFO
      // =========================

      "schoolName",
      "shortName",

      "primaryColor",
      "secondaryColor",

      // =========================
      // NAVBAR STYLE
      // =========================

      "navbarBackground",
      "navbarTextColor",
      "navbarHoverColor",
      "navbarHeight",
      "navbarFontSize",
      "navbarFontWeight",

      "navbarShadow",

      "borderBottomColor",

      "activeMenuColor",

      // =========================
      // MENU STYLE
      // =========================

      "menuFontSize",
      "menuFontWeight",
      "menuTextTransform",

      // =========================
      // SUBMENU STYLE
      // =========================

      "submenuBackground",
      "submenuTextColor",
      "submenuHoverBackground",
      "submenuHoverTextColor",
      "submenuBorderRadius",

      // =========================
      // MEGA MENU STYLE
      // =========================

      "megaMenuBackground",
      "megaMenuHeadingColor",
      "megaMenuTextColor",

      // =========================
      // TOP BAR
      // =========================

      "topBarBackground",
      "topBarTextColor",
      "topBarFontSize",

      "topBarEmail",
      "topBarPhone",
      "topBarAddress",

      // =========================
      // LOGIN BUTTON
      // =========================

      "loginButtonText",
      "loginButtonLink",

      "loginButtonBackground",
      "loginButtonTextColor",
      "loginButtonBorderColor",

      "loginButtonBorderRadius",
      "loginButtonFontSize",
      "loginButtonHoverColor",

      // =========================
      // ADMISSION BUTTON
      // =========================

      "admissionButtonText",
      "admissionButtonLink",

      "admissionButtonBackground",
      "admissionButtonTextColor",
      "admissionButtonBorderColor",

      "admissionButtonBorderRadius",
      "admissionButtonFontSize",
      "admissionButtonHoverColor",

      // =========================
      // MOBILE MENU
      // =========================

      "mobileMenuBackground",
      "mobileMenuBgColor",

      "mobileMenuTextColor",
      "mobileMenuActiveColor",

      // =========================
      // LOGO SIZE
      // =========================

      "logoWidth",
      "logoHeight",

      // =========================
      // OTHER SETTINGS
      // =========================

      "sticky",
      "transparent",

      "showShadow",
      "showTopBar",

      "showLoginButton",
      "showAdmissionButton",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        navbar[field] = req.body[field];
      }
    });

    if (req.body.sticky !== undefined) navbar.sticky = req.body.sticky;
    if (req.body.showShadow !== undefined)
      navbar.showShadow = req.body.showShadow;
    if (req.body.transparent !== undefined)
      navbar.transparent = req.body.transparent;

    if (req.body.showTopBar !== undefined)
      navbar.showTopBar = req.body.showTopBar;

    if (req.body.showLoginButton !== undefined)
      navbar.showLoginButton = req.body.showLoginButton;

    if (req.body.showAdmissionButton !== undefined)
      navbar.showAdmissionButton = req.body.showAdmissionButton;

    // Logo Upload

    if (req.files?.logo?.length) {
      if (navbar.logo?.public_id) {
        await deleteFromCloudinary(navbar.logo.public_id);
      }

      const result = await uploadToCloudinary(req.files.logo[0]);

      navbar.logo = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    // Favicon Upload

    if (req.files?.favicon?.length) {
      if (navbar.favicon?.public_id) {
        await deleteFromCloudinary(navbar.favicon.public_id);
      }

      const result = await uploadToCloudinary(req.files.favicon[0]);

      navbar.favicon = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    await navbar.save();

    res.json({
      success: true,
      message: "Navbar saved successfully",
      data: navbar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// GET ADMIN NAVBAR
// =========================================

exports.getNavbar = async (req, res) => {
  try {
    const navbar = await Navbar.findOne();

    res.json({
      success: true,
      data: navbar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// PUBLIC NAVBAR
// =========================================

exports.getPublicNavbar = async (req, res) => {
  try {
    const navbar = await Navbar.findOne().select("-createdAt -updatedAt -__v");

    res.json({
      success: true,
      data: navbar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// ADD MENU
// =========================================

exports.addMenu = async (req, res) => {
  try {
    const navbar = await Navbar.findOne();

    if (!navbar) {
      return res.status(404).json({
        success: false,
        message: "Navbar not found",
      });
    }

    navbar.menu.push(req.body);

    await navbar.save();

    res.json({
      success: true,
      message: "Menu added successfully",
      data: navbar.menu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// UPDATE MENU
// =========================================

exports.updateMenu = async (req, res) => {
  try {
    const navbar = await Navbar.findOne();

    if (!navbar) {
      return res.status(404).json({
        success: false,
        message: "Navbar not found",
      });
    }

    const index = Number(req.params.index);

    if (index < 0 || index >= navbar.menu.length) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    navbar.menu[index] = {
      ...navbar.menu[index].toObject(),
      ...req.body,
    };

    await navbar.save();

    res.json({
      success: true,
      message: "Menu updated successfully",
      data: navbar.menu[index],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// DELETE MENU
// =========================================

exports.deleteMenu = async (req, res) => {
  try {
    const navbar = await Navbar.findOne();

    if (!navbar) {
      return res.status(404).json({
        success: false,
        message: "Navbar not found",
      });
    }

    navbar.menu.splice(Number(req.params.index), 1);

    await navbar.save();

    res.json({
      success: true,
      message: "Menu deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// UPDATE MENU ORDER
// =========================================

exports.updateMenuOrder = async (req, res) => {
  try {
    const navbar = await Navbar.findOne();

    if (!navbar) {
      return res.status(404).json({
        success: false,
        message: "Navbar not found",
      });
    }

    navbar.menu = req.body.menu;

    await navbar.save();

    res.json({
      success: true,
      message: "Menu order updated successfully",
      data: navbar.menu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
