const https = require("https");
const http = require("http");
const PDFDocument = require("pdfkit");

// Remote image (Cloudinary URL) ko buffer me fetch karta hai, PDF me embed
// karne ke liye. Fail ho to null return karta hai — PDF generation isse ruknа
// nahi chahiye, sirf photo skip ho jaayegi.
function fetchImageBuffer(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", () => resolve(null));
  });
}

function addSectionTitle(doc, text) {
  doc.moveDown(0.8);
  doc
    .fontSize(13)
    .fillColor("#1a1a1a")
    .font("Helvetica-Bold")
    .text(text.toUpperCase());
  doc
    .moveTo(doc.x, doc.y + 2)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
    .strokeColor("#cccccc")
    .stroke();
  doc.moveDown(0.5);
  doc.font("Helvetica").fillColor("#000000").fontSize(10);
}

function addRow(doc, label, value) {
  const displayValue = value === undefined || value === null || value === ""
    ? "—"
    : String(value);
  doc
    .font("Helvetica-Bold")
    .text(`${label}: `, { continued: true })
    .font("Helvetica")
    .text(displayValue);
}

/**
 * Student profile ko PDF me render karke `res` stream par pipe kar deta hai.
 * Caller sirf res headers set karke isko call kare aur khud kuch aur na likhe.
 */
async function streamStudentProfilePdf(profile, res, { schoolName = "School" } = {}) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(res);

  const photoBuffer = await fetchImageBuffer(profile.profilePhoto);

  // ---- Header ----
  doc.fontSize(18).font("Helvetica-Bold").text(schoolName, { align: "center" });
  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor("#555555")
    .text("Student Profile", { align: "center" });
  doc.fillColor("#000000");
  doc.moveDown(1);

  if (photoBuffer) {
    try {
      doc.image(photoBuffer, doc.page.width - doc.page.margins.right - 80, 40, {
        width: 80,
        height: 80,
      });
    } catch (err) {
      // corrupt/unsupported image format — chup chaap skip karo
    }
  }

  // ---- Basic Info ----
  addSectionTitle(doc, "Basic Information");
  addRow(doc, "Name", profile.user?.name);
  addRow(doc, "Email", profile.user?.email);
  addRow(doc, "Class", profile.class ? `${profile.class.className || ""} ${profile.class.section || ""}`.trim() : "");
  addRow(doc, "Roll Number", profile.rollNumber);
  addRow(doc, "Date of Birth", profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN") : "");
  addRow(doc, "Blood Group", profile.bloodGroup);
  addRow(doc, "Status", profile.status);

  // ---- Contact & Address ----
  addSectionTitle(doc, "Contact & Address");
  addRow(doc, "Phone", profile.phone);
  addRow(doc, "Street", profile.address?.street);
  addRow(doc, "City", profile.address?.city);
  addRow(doc, "State", profile.address?.state);
  addRow(doc, "Pincode", profile.address?.pincode);

  // ---- Parent / Guardian ----
  addSectionTitle(doc, "Parent / Guardian");
  addRow(doc, "Father's Name", profile.fatherName);
  addRow(doc, "Mother's Name", profile.motherName);
  addRow(doc, "Guardian Occupation", profile.guardianOccupation);
  addRow(doc, "Parent Contact", profile.parent?.phone || profile.parent?.email);
  addRow(doc, "Emergency Contact", profile.emergencyContact?.name
    ? `${profile.emergencyContact.name} (${profile.emergencyContact.relation || "—"}) — ${profile.emergencyContact.phone || "—"}`
    : "");

  // ---- Admission ----
  addSectionTitle(doc, "Admission Details");
  addRow(doc, "Admission Number", profile.admissionNumber);
  addRow(doc, "Admission Date", profile.admissionDate ? new Date(profile.admissionDate).toLocaleDateString("en-IN") : "");
  addRow(doc, "Previous School", profile.previousSchool);
  addRow(doc, "House", profile.house);
  addRow(doc, "Transport Mode", profile.transportMode);
  if (profile.transportMode === "SCHOOL_BUS") {
    addRow(doc, "Bus Route", profile.busRoute);
  }

  // ---- Statutory ----
  addSectionTitle(doc, "Statutory / Identity");
  addRow(doc, "Aadhar Number", profile.aadharNumber ? profile.aadharNumber.replace(/(\d{4})(?=\d)/g, "$1 ") : "");
  addRow(doc, "Category", profile.category);
  addRow(doc, "Religion", profile.religion);
  addRow(doc, "Nationality", profile.nationality);
  addRow(doc, "Aadhar Front", profile.aadharFrontUrl ? "On file" : "Not uploaded");
  addRow(doc, "Aadhar Back", profile.aadharBackUrl ? "On file" : "Not uploaded");

  // ---- Medical ----
  if (profile.medicalConditions) {
    addSectionTitle(doc, "Medical Notes");
    doc.text(profile.medicalConditions, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
  }

  // ---- Attached Documents (list only, files khud embed nahi karte) ----
  if (profile.documents && profile.documents.length > 0) {
    addSectionTitle(doc, "Attached Documents");
    profile.documents.forEach((d) => {
      addRow(doc, d.type === "OTHER" ? (d.label || "Other") : d.type.replace(/_/g, " "), d.url);
    });
  }

  doc.moveDown(2);
  doc
    .fontSize(8)
    .fillColor("#999999")
    .text(`Generated on ${new Date().toLocaleString("en-IN")}`, { align: "right" });

  doc.end();
}

module.exports = { streamStudentProfilePdf };