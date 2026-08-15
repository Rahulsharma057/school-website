const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

// file buffer se raw text nikalo (extension ke hisaab se)
const extractText = async (buffer, mimetype) => {
  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  // plain text (.txt)
  return buffer.toString("utf-8");
};

// raw text ko structured questions mein todo
const parseQuestions = (rawText) => {
  const blocks = rawText.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const questions = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const questionLine = lines.find((l) => /^Q\d*[.)]/i.test(l));
    if (!questionLine) continue; // ye block question nahi hai, skip

    const text = questionLine.replace(/^Q\d*[.)]\s*/i, "");
    const optionLines = lines.filter((l) => /^[A-D][).]/i.test(l));
    const typeLine = lines.find((l) => /^TYPE:/i.test(l));
    const answerLine = lines.find((l) => /^ANSWER:/i.test(l));
    const marksLine = lines.find((l) => /^MARKS:/i.test(l));

    const marks = marksLine ? Number(marksLine.replace(/MARKS:/i, "").trim()) || 1 : 1;

    if (optionLines.length > 0) {
      // MCQ question
      const options = optionLines.map((l) => ({ text: l.replace(/^[A-D][).]\s*/i, "") }));
      const answerLetter = answerLine ? answerLine.replace(/ANSWER:/i, "").trim().toUpperCase() : null;
      const correctOptionIndex = answerLetter ? answerLetter.charCodeAt(0) - 65 : null; // A=0, B=1...

      questions.push({
        type: "MCQ",
        text,
        options,
        correctOptionIndex,
        marks,
      });
    } else {
      // SHORT/LONG answer question
      const type = typeLine && /LONG/i.test(typeLine) ? "LONG_ANSWER" : "SHORT_ANSWER";
      questions.push({ type, text, options: [], correctOptionIndex: null, marks });
    }
  }

  return questions;
};

module.exports = { extractText, parseQuestions };