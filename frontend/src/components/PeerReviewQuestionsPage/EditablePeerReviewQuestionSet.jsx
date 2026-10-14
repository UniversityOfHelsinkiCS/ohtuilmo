import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { peerReviewQuestionSetShape } from '../common/sharedPropTypes'

import QuestionSetItem from '../QuestionSetItem'
import QuestionSetItemEditor from '../QuestionSetItemEditor'
import PeerReviewQuestionsPreview from './PeerReviewQuestionsPreview'
import PeerReviewQuestionSetView from './PeerReviewQuestionSetView'

const renderPreview = (questions) => <PeerReviewQuestionsPreview questions={questions} />

const EditableRegistrationQuestionSet = ({ questionSet, onEditSave, startExpanded = false }) => {
  const [isEditing, setIsEditing] = useState(false)
  // sets that existed when the page was opened start collapsed, the ones the user
  // has created or edited are shown expanded
  const [expanded, setExpanded] = useState(startExpanded)

  const handleEditorSave = (name, questionsJson) => {
    const questions = JSON.parse(questionsJson)

    const updatedItem = {
      ...questionSet,
      name,
      questions,
    }
    onEditSave(updatedItem)
    setIsEditing(false)
    setExpanded(true)
  }

  const { name, questions } = questionSet

  const renderNormalItem = () => (
    <QuestionSetItem
      title={name}
      onEditClicked={() => setIsEditing(true)}
      collapsible
      initiallyExpanded={expanded}
    >
      <PeerReviewQuestionSetView questions={questions} />
    </QuestionSetItem>
  )

  const renderEditingItem = () => (
    <QuestionSetItemEditor
      initialName={name}
      initialQuestionsJson={JSON.stringify(questions, null, 2)}
      onSave={handleEditorSave}
      onCancel={() => {
        setIsEditing(false)
        setExpanded(true)
      }}
      renderPreview={renderPreview}
    />
  )

  return isEditing ? renderEditingItem() : renderNormalItem()
}

EditableRegistrationQuestionSet.propTypes = {
  questionSet: peerReviewQuestionSetShape,
  onEditSave: PropTypes.func,
  startExpanded: PropTypes.bool,
}

export default EditableRegistrationQuestionSet
