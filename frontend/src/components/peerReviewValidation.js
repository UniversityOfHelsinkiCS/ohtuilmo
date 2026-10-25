import { extractCallingName } from '../utils/functions'

// The same rules as in the backend (controllers/peerReview.js). They are checked before
// sending, so that the student sees right away which answers are missing.
const MIN_PEER_REVIEW_LENGTH = 7
const MIN_TEXT_LENGTH = 10
const MAX_NUMBER = 100000

const isBlank = (value) => value === null || value === undefined || value === ''

const fullName = (peer) => `${peer.first_names} ${peer.last_name}`
const callingName = (peer) => `${extractCallingName(peer.first_names)} ${peer.last_name}`

const problemOf = (answer, peers) => {
  switch (answer.type) {
    case 'radio': {
      const missing = peers.filter((peer) => isBlank(answer.peers[fullName(peer)]))
      return missing.length > 0
        ? `Choose an option for ${missing.map(callingName).join(', ')}`
        : null
    }
    case 'peerReview': {
      const tooShort = peers.filter(
        (peer) => (answer.peers[fullName(peer)] ?? '').trim().length < MIN_PEER_REVIEW_LENGTH,
      )
      return tooShort.length > 0
        ? `Write at least ${MIN_PEER_REVIEW_LENGTH} characters about ${tooShort.map(callingName).join(', ')}`
        : null
    }
    case 'text':
      return !answer.optional && (answer.answer ?? '').trim().length < MIN_TEXT_LENGTH
        ? `Write at least ${MIN_TEXT_LENGTH} characters`
        : null
    case 'number': {
      const number = Number(answer.answer)
      return isBlank(answer.answer) || isNaN(number) || number < 0 || number > MAX_NUMBER
        ? `Give a number between 0 and ${MAX_NUMBER}`
        : null
    }
    case 'radioOneliner':
      return !answer.optional && isBlank(answer.answer) ? 'Choose an option' : null
    default:
      return null
  }
}

// the problems of the answers by question index, empty if everything is answered
export const validateAnswers = (answerSheet, peers) =>
  answerSheet.reduce((problems, answer, questionId) => {
    const problem = problemOf(answer, peers)
    return problem ? { ...problems, [questionId]: problem } : problems
  }, {})
