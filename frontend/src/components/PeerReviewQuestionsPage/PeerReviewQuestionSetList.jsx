import React from 'react'
import EditablePeerReviewQuestionSet from './EditablePeerReviewQuestionSet'
import './PeerReviewQuestionSetList.css'

const compareQuestionSetCreatedAtDesc = (a, b) => b.createdAt.localeCompare(a.createdAt)

const RegistrationQuestionSetList = ({ questionSets, onQuestionSetUpdate, initialIds }) => {
  const byCreatedAtDesc = [...questionSets].sort(compareQuestionSetCreatedAtDesc)

  return (
    <ul className="peer-review-question-set-list">
      {byCreatedAtDesc.map((set) => (
        <EditablePeerReviewQuestionSet
          key={set.id}
          questionSet={set}
          onEditSave={onQuestionSetUpdate}
          startExpanded={!initialIds.has(set.id)}
        />
      ))}
    </ul>
  )
}

export default RegistrationQuestionSetList
