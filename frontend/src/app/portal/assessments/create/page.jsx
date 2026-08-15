"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import PortalGuard from "@/components/PortalGuard";

import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  Stack,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";

import { Delete, UploadFileOutlined } from "@mui/icons-material";

import { useMyAssignments } from "@/hooks/useTeacherAssignments";

import {
  useParseQuestionFile,
  useCreateAssessment,
} from "@/hooks/useAssessment";

// ======================================================
// HELPERS
// ======================================================

const createQuestionId = () => {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const emptyOptions = () => [
  { text: "" },
  { text: "" },
  { text: "" },
  { text: "" },
];

const emptyQuestion = () => ({
  _localId: createQuestionId(),
  type: "MCQ",
  text: "",
  options: emptyOptions(),
  correctOptionIndex: 0,
  marks: 1,
});

// ======================================================
// NORMALIZE UPLOADED QUESTIONS
// ======================================================

const normalizeQuestion = (question) => {
  const type = question?.type || "MCQ";

  if (type === "MCQ") {
    let options = Array.isArray(question?.options) ? question.options : [];

    options = options.map((option) => {
      if (typeof option === "string") {
        return {
          text: option,
        };
      }

      return {
        text: option?.text || "",
      };
    });

    // Exactly 4 options
    while (options.length < 4) {
      options.push({ text: "" });
    }

    if (options.length > 4) {
      options = options.slice(0, 4);
    }

    let correctOptionIndex = Number(question?.correctOptionIndex ?? 0);

    if (
      Number.isNaN(correctOptionIndex) ||
      correctOptionIndex < 0 ||
      correctOptionIndex > 3
    ) {
      correctOptionIndex = 0;
    }

    return {
      _localId: createQuestionId(),
      type: "MCQ",
      text: question?.text || "",
      options,
      correctOptionIndex,
      marks: Number(question?.marks) || 1,
    };
  }

  return {
    _localId: createQuestionId(),
    type,
    text: question?.text || "",
    options: [],
    correctOptionIndex: undefined,
    marks: Number(question?.marks) || 1,
  };
};

// ======================================================
// CLEAN PAYLOAD BEFORE API
// ======================================================

const prepareQuestionsForApi = (questions) => {
  return questions.map((question) => {
    if (question.type === "MCQ") {
      return {
        type: "MCQ",
        text: question.text.trim(),

        options: question.options.map((option) => ({
          text: option.text.trim(),
        })),

        correctOptionIndex: Number(question.correctOptionIndex ?? 0),

        marks: Number(question.marks),
      };
    }

    return {
      type: question.type,
      text: question.text.trim(),
      options: [],
      marks: Number(question.marks),
    };
  });
};

// ======================================================
// MAIN CONTENT
// ======================================================

function CreateAssessmentContent() {
  const router = useRouter();

  const { data: assignments = [] } = useMyAssignments();

  const { mutate: parseFile, isPending: parsing } = useParseQuestionFile();

  const { mutate: createAssessment, isPending: creating } =
    useCreateAssessment();

  const [tab, setTab] = useState(0);

  const [title, setTitle] = useState("");

  const [classId, setClassId] = useState("");

  const [subject, setSubject] = useState("");

  const [duration, setDuration] = useState(30);

  const [questions, setQuestions] = useState([emptyQuestion()]);

  const [validationError, setValidationError] = useState("");

  // ======================================================
  // UNIQUE CLASSES
  // ======================================================

  const uniqueClasses = [
    ...new Map(
      assignments
        .filter((a) => a?.class?._id)
        .map((a) => [String(a.class._id), a.class]),
    ).values(),
  ];

  // ======================================================
  // ADD QUESTION
  // ======================================================

  const handleAddQuestion = () => {
    setValidationError("");

    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  // ======================================================
  // REMOVE QUESTION
  // ======================================================

  const handleRemoveQuestion = (index) => {
    setValidationError("");

    if (questions.length === 1) {
      setValidationError("At least one question is required.");
      return;
    }

    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // ======================================================
  // UPDATE QUESTION
  // ======================================================

  const updateQuestion = (index, patch) => {
    setValidationError("");

    setQuestions((prev) =>
      prev.map((question, i) =>
        i === index
          ? {
              ...question,
              ...patch,
            }
          : question,
      ),
    );
  };

  // ======================================================
  // UPDATE OPTION
  // ======================================================

  const updateOption = (questionIndex, optionIndex, text) => {
    setValidationError("");

    setQuestions((prev) =>
      prev.map((question, qIndex) => {
        if (qIndex !== questionIndex) {
          return question;
        }

        const options = Array.isArray(question.options)
          ? [...question.options]
          : emptyOptions();

        while (options.length < 4) {
          options.push({ text: "" });
        }

        options[optionIndex] = {
          ...options[optionIndex],
          text,
        };

        return {
          ...question,
          options,
        };
      }),
    );
  };

  // ======================================================
  // CHANGE QUESTION TYPE
  // ======================================================

  const handleQuestionTypeChange = (questionIndex, newType) => {
    setValidationError("");

    setQuestions((prev) =>
      prev.map((question, index) => {
        if (index !== questionIndex) {
          return question;
        }

        if (newType === "MCQ") {
          return {
            ...question,
            type: "MCQ",
            options: emptyOptions(),
            correctOptionIndex: 0,
          };
        }

        return {
          ...question,
          type: newType,
          options: [],
          correctOptionIndex: undefined,
        };
      }),
    );
  };

  // ======================================================
  // FILE UPLOAD
  // ======================================================

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setValidationError("");

    const formData = new FormData();

    formData.append("file", file);

    parseFile(formData, {
      onSuccess: (res) => {
        const parsedQuestions = res?.data?.data?.questions || [];

        if (!Array.isArray(parsedQuestions)) {
          setValidationError(
            "Questions could not be extracted from this file.",
          );
          return;
        }

        if (parsedQuestions.length === 0) {
          setValidationError("No questions found in uploaded file.");
          return;
        }

        const normalizedQuestions = parsedQuestions.map(normalizeQuestion);

        setQuestions(normalizedQuestions);

        // Automatically open manual review
        setTab(0);
      },

      onError: (error) => {
        setValidationError(
          error?.response?.data?.message ||
            "Could not extract questions from file.",
        );
      },
    });

    // Reset input so same file can be selected again
    event.target.value = "";
  };

  // ======================================================
  // VALIDATE QUESTIONS
  // ======================================================

  const validateQuestions = () => {
    if (!questions.length) {
      return "At least one question is required.";
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      const questionNumber = i + 1;

      // Question text
      if (!question?.text?.trim()) {
        return `Question ${questionNumber}: Question text is required.`;
      }

      // Marks
      const marks = Number(question.marks);

      if (!marks || marks <= 0) {
        return `Question ${questionNumber}: Marks must be greater than 0.`;
      }

      // MCQ
      if (question.type === "MCQ") {
        const options = Array.isArray(question.options) ? question.options : [];

        if (options.length !== 4) {
          return `Question ${questionNumber}: MCQ must have exactly 4 options.`;
        }

        for (let optionIndex = 0; optionIndex < 4; optionIndex++) {
          const optionText = options[optionIndex]?.text?.trim();

          if (!optionText) {
            return `Question ${questionNumber}: Option ${String.fromCharCode(
              65 + optionIndex,
            )} is required.`;
          }
        }

        const correctIndex = Number(question.correctOptionIndex);

        if (
          Number.isNaN(correctIndex) ||
          correctIndex < 0 ||
          correctIndex > 3
        ) {
          return `Question ${questionNumber}: Please select the correct option.`;
        }
      }
    }

    return "";
  };

  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit = (status) => {
    setValidationError("");

    // Basic validation
    if (!title.trim()) {
      setValidationError("Assessment title is required.");
      return;
    }

    if (!classId) {
      setValidationError("Please select a class.");
      return;
    }

    if (!subject.trim()) {
      setValidationError("Subject is required.");
      return;
    }

    const durationNumber = Number(duration);

    if (!durationNumber || durationNumber <= 0) {
      setValidationError("Duration must be greater than 0 minutes.");
      return;
    }

    // Question validation
    const questionError = validateQuestions();

    if (questionError) {
      setValidationError(questionError);
      return;
    }

    // Clean questions
    const cleanQuestions = prepareQuestionsForApi(questions);

    const payload = {
      title: title.trim(),

      classId,

      subject: subject.trim(),

      questions: cleanQuestions,

      durationMinutes: durationNumber,

      status,
    };

    createAssessment(payload, {
      onSuccess: () => {
        router.push("/portal/assessments");
      },
    });
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <Box>
      <Typography variant="h4" mb={3} sx={{ fontWeight: 700 }}>
        Create Assessment
      </Typography>

      {/* ERROR */}
      {validationError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setValidationError("")}
        >
          {validationError}
        </Alert>
      )}

      {/* BASIC DETAILS */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: "1px solid #e2e8f0",
          borderRadius: 3,
        }}
      >
        <Stack spacing={2}>
          <TextField
            label="Title"
            size="small"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
          >
            <Select
              size="small"
              displayEmpty
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              sx={{
                flex: 1,
                minWidth: 180,
              }}
            >
              <MenuItem value="" disabled>
                Select Class
              </MenuItem>

              {uniqueClasses.map((c) => (
                <MenuItem key={String(c._id)} value={c._id}>
                  {c.className} - {c.section}
                </MenuItem>
              ))}
            </Select>

            <TextField
              label="Subject"
              size="small"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              sx={{ flex: 1 }}
            />

            <TextField
              label="Duration (min)"
              size="small"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              sx={{
                width: {
                  xs: "100%",
                  md: 140,
                },
              }}
              inputProps={{
                min: 1,
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* TABS */}
      <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="Add Questions Manually" />

        <Tab label="Upload File (auto-extract)" />
      </Tabs>

      {/* UPLOAD */}
      {tab === 1 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: "1px solid #e2e8f0",
            borderRadius: 3,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              mb: 2,
            }}
          >
            Upload a PDF, Word, or text file with questions in this format:
          </Typography>

          <Box
            component="pre"
            sx={{
              p: 2,
              backgroundColor: "#f8fafc",
              borderRadius: 2,
              fontSize: 12.5,
              overflowX: "auto",
            }}
          >
            {`Q1. What is the capital of India?
A) Mumbai
B) Delhi
C) Chennai
D) Kolkata
ANSWER: B
MARKS: 2

Q2. Explain photosynthesis in short.
TYPE: SHORT_ANSWER
MARKS: 5`}
          </Box>

          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileOutlined />}
            sx={{
              mt: 2,
              textTransform: "none",
            }}
            disabled={parsing}
          >
            {parsing ? "Extracting..." : "Choose File"}

            <input
              type="file"
              hidden
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
            />
          </Button>
        </Paper>
      )}

      {/* QUESTIONS TITLE */}
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          mb: 2,
        }}
      >
        Questions ({questions.length})
      </Typography>

      {/* QUESTIONS */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {questions.map((question, index) => (
          <Paper
            key={question._localId}
            elevation={0}
            sx={{
              p: 3,
              border: "1px solid #e2e8f0",
              borderRadius: 3,
            }}
          >
            {/* HEADER */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ mb: 2 }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: "#64748b",
                }}
              >
                Question {index + 1}
              </Typography>

              <IconButton
                size="small"
                color="error"
                onClick={() => handleRemoveQuestion(index)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Stack>

            <Stack spacing={2}>
              {/* QUESTION TEXT */}
              <TextField
                label="Question Text"
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={question.text}
                onChange={(e) =>
                  updateQuestion(index, {
                    text: e.target.value,
                  })
                }
              />

              {/* TYPE + MARKS */}
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={2}
              >
                <Select
                  size="small"
                  value={question.type || "MCQ"}
                  onChange={(e) =>
                    handleQuestionTypeChange(index, e.target.value)
                  }
                  sx={{
                    width: {
                      xs: "100%",
                      sm: 220,
                    },
                  }}
                >
                  <MenuItem value="MCQ">MCQ (Auto-check)</MenuItem>

                  <MenuItem value="SHORT_ANSWER">Short Answer</MenuItem>

                  <MenuItem value="LONG_ANSWER">Long Answer</MenuItem>
                </Select>

                <TextField
                  label="Marks"
                  size="small"
                  type="number"
                  value={question.marks}
                  onChange={(e) =>
                    updateQuestion(index, {
                      marks: Number(e.target.value),
                    })
                  }
                  sx={{
                    width: {
                      xs: "100%",
                      sm: 100,
                    },
                  }}
                  inputProps={{
                    min: 1,
                  }}
                />
              </Stack>

              {/* MCQ OPTIONS */}
              {question.type === "MCQ" && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Options — select the correct answer
                  </Typography>

                  <RadioGroup
                    value={String(question.correctOptionIndex ?? 0)}
                    onChange={(e) =>
                      updateQuestion(index, {
                        correctOptionIndex: Number(e.target.value),
                      })
                    }
                  >
                    {Array.from({
                      length: 4,
                    }).map((_, optionIndex) => {
                      const option = question.options?.[optionIndex] || {
                        text: "",
                      };

                      return (
                        <Stack
                          key={`${question._localId}-option-${optionIndex}`}
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ mb: 1 }}
                        >
                          <FormControlLabel
                            value={optionIndex}
                            control={<Radio size="small" />}
                            label=""
                            sx={{
                              mr: 0,
                            }}
                          />

                          <TextField
                            size="small"
                            fullWidth
                            placeholder={`Option ${String.fromCharCode(
                              65 + optionIndex,
                            )}`}
                            value={option.text || ""}
                            onChange={(e) =>
                              updateOption(index, optionIndex, e.target.value)
                            }
                          />
                        </Stack>
                      );
                    })}
                  </RadioGroup>
                </Box>
              )}

              {/* ANSWER TYPE INFO */}
              {question.type === "SHORT_ANSWER" && (
                <Alert severity="info">
                  Student will type a short answer. Teacher can review/check it.
                </Alert>
              )}

              {question.type === "LONG_ANSWER" && (
                <Alert severity="info">
                  Student will type a detailed answer. Teacher can review/check
                  it.
                </Alert>
              )}
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* ACTIONS */}
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
      >
        <Button
          variant="outlined"
          onClick={handleAddQuestion}
          sx={{
            textTransform: "none",
          }}
        >
          + Add Question
        </Button>

        <Button
          variant="outlined"
          onClick={() => handleSubmit("DRAFT")}
          disabled={creating}
          sx={{
            textTransform: "none",
          }}
        >
          {creating ? "Saving..." : "Save as Draft"}
        </Button>

        <Button
          variant="contained"
          onClick={() => handleSubmit("PUBLISHED")}
          disabled={creating}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          {creating ? "Publishing..." : "Publish Now"}
        </Button>
      </Stack>
    </Box>
  );
}

// ======================================================
// PAGE
// ======================================================

export default function CreateAssessmentPage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <Box sx={{ p: 3 }}>
        <CreateAssessmentContent />
      </Box>
    </PortalGuard>
  );
}
