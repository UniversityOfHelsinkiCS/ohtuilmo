import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Questions } from '../PeerReviewPage'

// made up group members, so that the per member questions have something to show
const SAMPLE_PEERS = [
  { first_names: 'Maija', last_name: 'Meikäläinen' },
  { first_names: 'Teemu', last_name: 'Teekkari' },
  { first_names: 'Sinä', last_name: 'Itse' },
]

class PreviewErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return <p>The questions can not be previewed: {this.state.error.message}</p>
    }
    return this.props.children
  }
}

PreviewErrorBoundary.propTypes = {
  children: PropTypes.node,
}

// shows the questions the same way as students see them in the peer review form
const PeerReviewQuestionsPreview = ({ questions }) => {
  const [answers, setAnswers] = useState({})
  const [peerAnswers, setPeerAnswers] = useState({})

  const answerSheet = questions.map((question, questionId) => ({
    answer: answers[questionId] ?? (question.type === 'number' ? 0 : ''),
    peers: peerAnswers[questionId] ?? {},
  }))

  const updateAnswer = (answer, questionId) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const updatePeerReview = (peerId, answer, questionId) => {
    setPeerAnswers({
      ...peerAnswers,
      [questionId]: { ...peerAnswers[questionId], [peerId]: answer },
    })
  }

  return (
    <div className="peer-review-questions-preview">
      <PreviewErrorBoundary key={JSON.stringify(questions)}>
        <Questions
          questions={questions}
          peers={SAMPLE_PEERS}
          answerSheet={answerSheet}
          updateAnswer={updateAnswer}
          updatePeerReview={updatePeerReview}
        />
      </PreviewErrorBoundary>
    </div>
  )
}

PeerReviewQuestionsPreview.propTypes = {
  questions: PropTypes.array.isRequired,
}

export default PeerReviewQuestionsPreview
