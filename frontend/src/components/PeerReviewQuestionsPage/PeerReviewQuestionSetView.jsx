import React, { useState } from 'react'
import PropTypes from 'prop-types'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import PeerReviewQuestionsTable from '../PeerReviewQuestionsTable'
import PeerReviewQuestionsPreview from './PeerReviewQuestionsPreview'
import './PeerReviewQuestionSetView.css'

// shows the questions of a set either as a table or as students see them
const PeerReviewQuestionSetView = ({ questions }) => {
  const [view, setView] = useState('table')

  return (
    <div>
      <div className="peer-review-question-set__view-toggle">
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_event, newView) => newView && setView(newView)}
        >
          <ToggleButton value="table">Table</ToggleButton>
          <ToggleButton value="preview">Preview</ToggleButton>
        </ToggleButtonGroup>
      </div>
      {view === 'preview' ? (
        <PeerReviewQuestionsPreview questions={questions} />
      ) : (
        <PeerReviewQuestionsTable questions={questions} />
      )}
    </div>
  )
}

PeerReviewQuestionSetView.propTypes = {
  questions: PropTypes.array.isRequired,
}

export default PeerReviewQuestionSetView
