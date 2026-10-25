// The questions can be changed while a peer review round is open, so the answer sheets of
// a round can differ. The answers are matched by the question, not by the position.
const sameQuestion = (a, b) => a.type === b.type && a.questionHeader === b.questionHeader

// the answer of a student to a question, undefined if the student was not asked it
export const answerTo = (answer, question) =>
  answer.answer_sheet.find((answered) => sameQuestion(answered, question))

// the questions of all the answer sheets in the order they were asked
export const questionsOf = (answers) =>
  answers
    .flatMap((answer) => answer.answer_sheet)
    .reduce(
      (questions, question) =>
        questions.some((known) => sameQuestion(known, question))
          ? questions
          : questions.concat(question),
      [],
    )
