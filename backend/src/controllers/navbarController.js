const Navbar = require("../models/Navbar");
const CustomPage = require("../models/CustomPage");

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

    const fields = [
      "schoolName",
      "shortName",
      "primaryColor",
      "secondaryColor",
      "navbarBackground",
      "navbarTextColor",
      "navbarHoverColor",
      "navbarHeight",
      "navbarFontSize",
      "navbarFontWeight",
      "navbarShadow",
      "borderBottomColor",
      "activeMenuColor",
      "menuFontSize",
      "menuFontWeight",
      "menuTextTransform",
      "submenuBackground",
      "submenuTextColor",
      "submenuHoverBackground",
      "submenuHoverTextColor",
      "submenuBorderRadius",
      "megaMenuBackground",
      "megaMenuHeadingColor",
      "megaMenuTextColor",
      "topBarBackground",
      "topBarTextColor",
      "topBarFontSize",
      "topBarEmail",
      "topBarPhone",
      "topBarAddress",
      "loginButtonText",
      "loginButtonLink",
      "loginButtonBackground",
      "loginButtonTextColor",
      "loginButtonBorderColor",
      "loginButtonBorderRadius",
      "loginButtonFontSize",
      "loginButtonHoverColor",
      "admissionButtonText",
      "admissionButtonLink",
      "admissionButtonBackground",
      "admissionButtonTextColor",
      "admissionButtonBorderColor",
      "admissionButtonBorderRadius",
      "admissionButtonFontSize",
      "admissionButtonHoverColor",
      "mobileMenuBackground",
      "mobileMenuBgColor",
      "mobileMenuTextColor",
      "mobileMenuActiveColor",
      "logoWidth",
      "logoHeight",
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

    if (req.files?.logo?.length) {
      if (navbar.logo?.public_id) {
        await deleteFromCloudinary(navbar.logo.public_id);
      }
      const result = await uploadToCloudinary(req.files.logo[0]);
      navbar.logo = { url: result.secure_url, public_id: result.public_id };
    }

    if (req.files?.favicon?.length) {
      if (navbar.favicon?.public_id) {
        await deleteFromCloudinary(navbar.favicon.public_id);
      }
      const result = await uploadToCloudinary(req.files.favicon[0]);
      navbar.favicon = { url: result.secure_url, public_id: result.public_id };
    }

    await navbar.save();

    res.json({
      success: true,
      message: "Navbar saved successfully",
      data: navbar,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================
// GET ADMIN NAVBAR
// =========================================

exports.getNavbar = async (req, res) => {
  try {
    const navbar = await Navbar.findOne();
    res.json({ success: true, data: navbar });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================
// PUBLIC NAVBAR
// =========================================
// FIX: now merges in every CustomPage flagged showInNavbar:true — admin
// no longer has to manually re-add a dynamic page to the Menu Builder
// for it to show up. Merge happens at READ time only (nothing extra is
// stored on the Navbar document itself), so toggling a page's
// showInNavbar flag takes effect immediately on next navbar fetch.

exports.getPublicNavbar = async (req, res) => {
  try {
    const navbar = await Navbar.findOne()
      .select("-createdAt -updatedAt -__v")
      .lean();

    if (!navbar) {
      return res.json({ success: true, data: navbar });
    }

    const dynamicPages = await CustomPage.find({
      showInNavbar: true,
      status: true,
    })
      .select("title route navbarOrder navbarParentId")
      .sort({ navbarOrder: 1 })
      .lean();

    // clone menu items so we can safely push into their `children`
    const menu = (navbar.menu || []).map((item) => ({
      ...item,
      children: [...(item.children || [])],
    }));

    const topLevelItems = [];

    for (const page of dynamicPages) {
      const dynamicItem = {
        _id: `page-${page._id}`,
        title: page.title,
        url: page.route,
        icon: "",
        target: "_self",
        order: page.navbarOrder ?? 0,
        visible: true,
        isMegaMenu: false,
        children: [],
        roles: [],
      };

      // NEW — if admin picked a parent menu item, nest as a submenu
      // link instead of dropping it at the top level
      const parent = page.navbarParentId
        ? menu.find((m) => String(m._id) === String(page.navbarParentId))
        : null;

      if (parent) {
        parent.children = [...parent.children, dynamicItem].sort(
          (a, b) => (a.order || 0) - (b.order || 0),
        );
      } else {
        topLevelItems.push(dynamicItem);
      }
    }

    const mergedMenu = [...menu, ...topLevelItems].sort(
      (a, b) => (a.order || 0) - (b.order || 0),
    );

    return res.json({
      success: true,
      data: { ...navbar, menu: mergedMenu },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================
// ADD MENU
// =========================================

exports.addMenu = async (req, res) => {
  try {
    const navbar = await Navbar.findOne();

    if (!navbar) {
      return res
        .status(404)
        .json({ success: false, message: "Navbar not found" });
    }

    navbar.menu.push(req.body);
    await navbar.save();

    res.json({
      success: true,
      message: "Menu added successfully",
      data: navbar.menu,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================
// UPDATE MENU
// =========================================

exports.updateMenu = async (req, res) => {
  try {
    const navbar = await Navbar.findOne();

    if (!navbar) {
      return res
        .status(404)
        .json({ success: false, message: "Navbar not found" });
    }

    const index = Number(req.params.index);

    if (index < 0 || index >= navbar.menu.length) {
      return res
        .status(404)
        .json({ success: false, message: "Menu not found" });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================
// DELETE MENU
// =========================================

exports.deleteMenu = async (req, res) => {
  try {
    const navbar = await Navbar.findOne();

    if (!navbar) {
      return res
        .status(404)
        .json({ success: false, message: "Navbar not found" });
    }

    navbar.menu.splice(Number(req.params.index), 1);
    await navbar.save();

    res.json({ success: true, message: "Menu deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================
// UPDATE MENU ORDER
// =========================================

exports.updateMenuOrder = async (req, res) => {
  try {
    const navbar = await Navbar.findOne();

    if (!navbar) {
      return res
        .status(404)
        .json({ success: false, message: "Navbar not found" });
    }

    navbar.menu = req.body.menu;
    await navbar.save();

    res.json({
      success: true,
      message: "Menu order updated successfully",
      data: navbar.menu,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
