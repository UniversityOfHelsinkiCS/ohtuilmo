import React from 'react'
import PropTypes from 'prop-types'

import TablePreviewToggle from '../common/TablePreviewToggle'
import PeerReviewQuestionsTable from '../PeerReviewQuestionsTable'
import PeerReviewQuestionsPreview from './PeerReviewQuestionsPreview'
import './PeerReviewQuestionSetView.css'

// shows the questions of a set either as a table or as students see them
const PeerReviewQuestionSetView = ({ questions }) => (
  <TablePreviewToggle
    table={<PeerReviewQuestionsTable questions={questions} />}
    preview={<PeerReviewQuestionsPreview questions={questions} />}
  />
)

PeerReviewQuestionSetView.propTypes = {
  questions: PropTypes.array.isRequired,
}

export default PeerReviewQuestionSetView
