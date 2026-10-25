// The same rules as in the backend (controllers/instructorReview.js). They are checked
// before sending, so that the instructor sees right away which answers are missing.
const MIN_TEXT_LENGTH = 5
const MAX_TEXT_LENGTH = 5000
const MAX_GRADE = 5

const isBlank = (value) => value === null || value === undefined || value === ''

const problemOf = (question) => {
  if (question.type === 'text') {
    const length = (question.answer ?? '').trim().length
    if (length < MIN_TEXT_LENGTH) return `Write at least ${MIN_TEXT_LENGTH} characters`
    if (length > MAX_TEXT_LENGTH) return `Write at most ${MAX_TEXT_LENGTH} characters`
    return null
  }
  if (question.type === 'number') {
    const grade = Number(question.answer)
    return isBlank(question.answer) || isNaN(grade) || grade < 0 || grade > MAX_GRADE
      ? `Give a grade between 0 and ${MAX_GRADE}`
      : null
  }
  return null
}

// the problems of the review of a student by question index, empty if it is complete
export const problemsOfStudent = (student) =>
  student.answers.reduce((problems, question, questionId) => {
    const problem = problemOf(question)
    return problem ? { ...problems, [questionId]: problem } : problems
  }, {})

export const studentName = (student) => `${student.name.first_names} ${student.name.last_name}`
