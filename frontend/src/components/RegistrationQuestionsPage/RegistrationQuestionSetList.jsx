import React from 'react'
import EditableRegistrationQuestionSet from './EditableRegistrationQuestionSet'
import './RegistrationQuestionSetList.css'

const compareQuestionSetCreatedAtDesc = (a, b) => b.createdAt.localeCompare(a.createdAt)

const RegistrationQuestionSetList = ({ questionSets, onQuestionSetUpdate, initialIds }) => {
  const byCreatedAtDesc = [...questionSets].sort(compareQuestionSetCreatedAtDesc)

  return (
    <ul className="registration-question-set-list">
      {byCreatedAtDesc.map((set) => (
        <EditableRegistrationQuestionSet
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
