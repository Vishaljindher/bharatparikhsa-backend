// ✅ aiQuestionGenerator.js — supports MCQ, True/False, Text perfectly

function generateQuestionsFromText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const questions = [];
  const questionPattern = /^(?:question|ques|q)\s*\d*[:.-]\s*(.+)$/i;
  const answerPattern = /^(?:ans|answer|a)[:.-]\s*(.*)$/i;
  const optionPattern = /^[A-Da-d][).:-]\s*(.+)$/;
  const badPattern = /_{3,}/;

  let currentQuestion = null;
  let currentOptions = [];
  let currentType = "text";
  let currentAnswer = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (badPattern.test(line)) continue;

    // 🧠 Detect Question
    const qMatch = line.match(questionPattern);
    if (qMatch) {
      // Save previous question before starting new one
      if (currentQuestion) {
        questions.push({
          question: currentQuestion,
          type: currentType,
          options: currentOptions.length ? currentOptions : undefined,
          answer: currentAnswer,
        });
      }

      currentQuestion = qMatch[1].trim();
      currentOptions = [];
      currentType = "text";
      currentAnswer = "";
      continue;
    }

    // 🧩 Detect Options (A/B/C/D)
    const optMatch = line.match(optionPattern);
    if (optMatch && currentQuestion) {
      currentOptions.push(optMatch[1].trim());
      currentType = "mcq"; // ✅ mark type as MCQ
      continue;
    }

    // 🧩 Detect Answer Line
    const aMatch = line.match(answerPattern);
    if (aMatch && currentQuestion) {
      let answerText = aMatch[1].trim();

      // ✅ Detect True/False
      if (/^(true|false)$/i.test(answerText)) {
        currentType = "truefalse";
        currentOptions = ["True", "False"];
      }

      // ✅ Convert letter (A/B/C/D) → option text if possible
      if (/^[A-Da-d]$/.test(answerText) && currentOptions.length) {
        const index = answerText.toUpperCase().charCodeAt(0) - 65;
        if (currentOptions[index]) {
          answerText = currentOptions[index];
        }
      }

      currentAnswer = answerText;

      // Save full question block
      questions.push({
        question: currentQuestion,
        type: currentType,
        options: currentOptions.length ? currentOptions : undefined,
        answer: currentAnswer,
      });

      // Reset
      currentQuestion = null;
      currentOptions = [];
      currentType = "text";
      currentAnswer = "";
    }
  }

  // Push last pending question (if any)
  if (currentQuestion) {
    questions.push({
      question: currentQuestion,
      type: currentType,
      options: currentOptions.length ? currentOptions : undefined,
      answer: currentAnswer,
    });
  }

  return questions;
}

module.exports = generateQuestionsFromText;
