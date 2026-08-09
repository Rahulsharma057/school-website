const PDFDocument = require("pdfkit");

// Builds the syllabus PDF entirely in-memory (no temp files) and
// resolves with a Buffer, ready to upload straight to Cloudinary.
const generateSyllabusPdf = (syllabus) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(20).font("Helvetica-Bold").text(syllabus.schoolName, { align: "center" });

      doc
        .moveDown(0.3)
        .fontSize(14)
        .font("Helvetica")
        .text(`Syllabus — ${syllabus.className}`, { align: "center" });

      if (syllabus.academicYear) {
        doc
          .moveDown(0.2)
          .fontSize(11)
          .fillColor("#666")
          .text(`Academic Year: ${syllabus.academicYear}`, { align: "center" });
      }

      doc.moveDown(0.5).fillColor("#000");
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#dddddd").stroke();
      doc.moveDown(1);

      if (syllabus.description) {
        doc.fontSize(11).font("Helvetica-Oblique").text(syllabus.description);
        doc.moveDown(1);
      }

      const sortedSubjects = [...(syllabus.subjects || [])].sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      );

      sortedSubjects.forEach((subject, index) => {
        if (doc.y > 700) doc.addPage();

        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#18181b")
          .text(`${index + 1}. ${subject.name}`);

        doc.moveDown(0.3);

        (subject.topics || []).forEach((topic) => {
          if (doc.y > 730) doc.addPage();

          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .fillColor("#000")
            .text(`• ${topic.title}`, { indent: 15 });

          if (topic.description) {
            doc
              .fontSize(10)
              .font("Helvetica")
              .fillColor("#444")
              .text(topic.description, { indent: 30 });
          }

          doc.moveDown(0.2);
        });

        doc.moveDown(0.8);
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

module.exports = generateSyllabusPdf;