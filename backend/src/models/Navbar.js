const mongoose = require("mongoose");

// =====================================
// CHILD MENU
// =====================================

const childMenuSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      default: "/",
      trim: true,
    },

    icon: {
      type: String,
      default: "",
    },

    target: {
      type: String,
      enum: ["_self", "_blank"],
      default: "_self",
    },

    order: {
      type: Number,
      default: 0,
    },

    visible: {
      type: Boolean,
      default: true,
    },

    roles: [
      {
        type: String,
        enum: [
          "SUPER_ADMIN",
          "ADMIN",
          "PRINCIPAL",
          "TEACHER",
          "ACCOUNTANT",
          "STUDENT",
          "PARENT",
        ],
      },
    ],
  },
  {
    _id: true,
  }
);

// =====================================
// MENU
// =====================================

const menuSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      default: "/",
      trim: true,
    },

    icon: {
      type: String,
      default: "",
    },

    target: {
      type: String,
      enum: ["_self", "_blank"],
      default: "_self",
    },

    order: {
      type: Number,
      default: 0,
    },

    visible: {
      type: Boolean,
      default: true,
    },

    isMegaMenu: {
      type: Boolean,
      default: false,
    },

    children: [childMenuSchema],

    roles: [
      {
        type: String,
        enum: [
          "SUPER_ADMIN",
          "ADMIN",
          "PRINCIPAL",
          "TEACHER",
          "ACCOUNTANT",
          "STUDENT",
          "PARENT",
        ],
      },
    ],
  },
  {
    _id: true,
  }
);

// =====================================
// NAVBAR
// =====================================

const navbarSchema = new mongoose.Schema(
  {
    // ---------------------------------
    // School Info
    // ---------------------------------

    schoolName: {
      type: String,
      required: true,
      trim: true,
    },

    shortName: {
      type: String,
      trim: true,
    },

    logo: {
      url: String,
      public_id: String,
    },

    favicon: {
      url: String,
      public_id: String,
    },

    // ---------------------------------
    // General Colors
    // ---------------------------------

    primaryColor: {
      type: String,
      default: "#1976d2",
    },

    secondaryColor: {
      type: String,
      default: "#0d47a1",
    },

    // ---------------------------------
    // Navbar Settings
    // ---------------------------------

    sticky: {
      type: Boolean,
      default: true,
    },

    transparent: {
      type: Boolean,
      default: false,
    },

    navbarBackground: {
      type: String,
      default: "#ffffff",
    },

    navbarTextColor: {
      type: String,
      default: "#222222",
    },

    navbarHoverColor: {
      type: String,
      default: "#1976d2",
    },

    navbarFontSize: {
      type: Number,
      default: 15,
    },

    navbarFontWeight: {
      type: Number,
      default: 600,
    },

    navbarHeight: {
      type: Number,
      default: 75,
    },

    navbarShadow: {
      type: Boolean,
      default: true,
    },

    // ---------------------------------
    // Logo
    // ---------------------------------

    logoWidth: {
      type: Number,
      default: 50,
    },

    logoHeight: {
      type: Number,
      default: 50,
    },

    // ---------------------------------
    // Top Bar
    // ---------------------------------

    showTopBar: {
      type: Boolean,
      default: true,
    },

    topBarBackground: {
      type: String,
      default: "#0d47a1",
    },

    topBarTextColor: {
      type: String,
      default: "#ffffff",
    },

    topBarFontSize: {
      type: Number,
      default: 13,
    },

    topBarEmail: {
      type: String,
      default: "",
    },

    topBarPhone: {
      type: String,
      default: "",
    },

    topBarAddress: {
      type: String,
      default: "",
    },

    // ---------------------------------
    // Login Button
    // ---------------------------------

    showLoginButton: {
      type: Boolean,
      default: true,
    },

    loginButtonText: {
      type: String,
      default: "Login",
    },

    loginButtonLink: {
      type: String,
      default: "/login",
    },

    loginButtonBackground: {
      type: String,
      default: "#1976d2",
    },

    loginButtonTextColor: {
      type: String,
      default: "#ffffff",
    },

    loginButtonBorderColor: {
      type: String,
      default: "#1976d2",
    },

    loginButtonHoverColor: {
      type: String,
      default: "#1565c0",
    },

    loginButtonFontSize: {
      type: Number,
      default: 15,
    },

    loginButtonBorderRadius: {
      type: Number,
      default: 8,
    },

    // =====================================
// NAVBAR DESIGN
// =====================================

menuFontSize: {
  type: Number,
  default: 16,
},

menuFontWeight: {
  type: Number,
  default: 500,
},

menuTextTransform: {
  type: String,
  enum: ["none", "uppercase", "capitalize", "lowercase"],
  default: "none",
},

navbarHeight: {
  type: Number,
  default: 80,
},

logoWidth: {
  type: Number,
  default: 50,
},

logoHeight: {
  type: Number,
  default: 50,
},

mobileMenuBgColor: {
  type: String,
  default: "#ffffff",
},

mobileMenuTextColor: {
  type: String,
  default: "#222222",
},

activeMenuColor: {
  type: String,
  default: "#1976d2",
},

borderBottomColor: {
  type: String,
  default: "#e5e5e5",
},

showShadow: {
  type: Boolean,
  default: true,
},
    // ---------------------------------
    // Admission Button
    // ---------------------------------

    showAdmissionButton: {
      type: Boolean,
      default: true,
    },

    admissionButtonText: {
      type: String,
      default: "Admission Open",
    },

    admissionButtonLink: {
      type: String,
      default: "/admission",
    },

    admissionButtonBackground: {
      type: String,
      default: "#2e7d32",
    },

    admissionButtonTextColor: {
      type: String,
      default: "#ffffff",
    },

    admissionButtonHoverColor: {
      type: String,
      default: "#1b5e20",
    },

    admissionButtonFontSize: {
      type: Number,
      default: 15,
    },

    admissionButtonBorderRadius: {
      type: Number,
      default: 8,
    },

    // ---------------------------------
    // Dropdown / Submenu
    // ---------------------------------

    submenuBackground: {
      type: String,
      default: "#ffffff",
    },

    submenuTextColor: {
      type: String,
      default: "#222222",
    },

    submenuHoverBackground: {
      type: String,
      default: "#f5f5f5",
    },

    submenuHoverTextColor: {
      type: String,
      default: "#1976d2",
    },

    submenuBorderRadius: {
      type: Number,
      default: 10,
    },

    // ---------------------------------
    // Mega Menu
    // ---------------------------------

    megaMenuBackground: {
      type: String,
      default: "#ffffff",
    },

    megaMenuTextColor: {
      type: String,
      default: "#222222",
    },

    megaMenuHeadingColor: {
      type: String,
      default: "#1976d2",
    },

    // ---------------------------------
    // Mobile Menu
    // ---------------------------------

    mobileMenuBackground: {
      type: String,
      default: "#ffffff",
    },

    mobileMenuTextColor: {
      type: String,
      default: "#222222",
    },

    mobileMenuActiveColor: {
      type: String,
      default: "#1976d2",
    },

    // ---------------------------------
    // Menu
    // ---------------------------------

    menu: [menuSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Navbar", navbarSchema);