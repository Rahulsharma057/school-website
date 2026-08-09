const { randomUUID } = require("crypto");

// A factory function (not a static object) so every reset / first-load
// gets fresh unique ids for each section and link — reusing the same
// ids across resets could collide with anything still cached client-side.
const getDefaultFooter = () => ({
  sections: [
    {
      id: randomUUID(),
      title: "Quick Links",
      order: 0,
      links: [
        { id: randomUUID(), label: "Home", url: "/", order: 0, openInNewTab: false },
        { id: randomUUID(), label: "About Us", url: "/about", order: 1, openInNewTab: false },
        { id: randomUUID(), label: "Admissions", url: "/admissions", order: 2, openInNewTab: false },
        { id: randomUUID(), label: "Contact", url: "/contact", order: 3, openInNewTab: false },
      ],
    },
    {
      id: randomUUID(),
      title: "Academics",
      order: 1,
      links: [
        { id: randomUUID(), label: "Curriculum", url: "/academics/curriculum", order: 0, openInNewTab: false },
        { id: randomUUID(), label: "Faculty", url: "/academics/faculty", order: 1, openInNewTab: false },
        { id: randomUUID(), label: "Academic Calendar", url: "/academics/calendar", order: 2, openInNewTab: false },
      ],
    },
    {
      id: randomUUID(),
      title: "Resources",
      order: 2,
      links: [
        { id: randomUUID(), label: "Gallery", url: "/gallery", order: 0, openInNewTab: false },
        { id: randomUUID(), label: "Downloads", url: "/downloads", order: 1, openInNewTab: false },
        { id: randomUUID(), label: "FAQs", url: "/faqs", order: 2, openInNewTab: false },
      ],
    },
  ],

  socialLinks: [
    { id: randomUUID(), platform: "facebook", label: "", url: "https://facebook.com", order: 0 },
    { id: randomUUID(), platform: "instagram", label: "", url: "https://instagram.com", order: 1 },
    { id: randomUUID(), platform: "youtube", label: "", url: "https://youtube.com", order: 2 },
  ],

  branding: {
    showLogo: true,
    logoUrl: "",
    logoPublicId: "",
    description: "Empowering students to learn, grow, and lead — every single day.",
  },

  copyrightText: "© {year} All rights reserved.",

  style: {
    bgColor: "#18181b",
    textColor: "#d4d4d8",
    headingColor: "#ffffff",
    linkColor: "#a1a1aa",
    linkHoverColor: "#ffffff",
    borderColor: "#27272a",
    columns: 4,
    alignment: "left",
    showDivider: true,
    padding: "comfortable",
  },
});

module.exports = getDefaultFooter;
