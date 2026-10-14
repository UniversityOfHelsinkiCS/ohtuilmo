import React from 'react'
import PropTypes from 'prop-types'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import QuestionSetForm from './QuestionSetForm'
import './QuestionSetItemEditor.css'

const SaveButton = ({ className }) => (
  <Button className={className} type="submit" variant="contained" color="primary">
    Save changes
  </Button>
)

SaveButton.propTypes = {
  className: PropTypes.string,
}

const CancelButton = ({ className, onClick }) => (
  <Button className={className} onClick={onClick}>
    Cancel
  </Button>
)

CancelButton.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
}

const QuestionSetItemEditor = ({
  initialName,
  initialQuestionsJson,
  onSave,
  onCancel,
  renderPreview,
}) => {
  const formControls = (
    <>
      <SaveButton className="question-set-item-editor__save-button" />
      <CancelButton className="question-set-item-editor__cancel-button" onClick={onCancel} />
    </>
  )

  return (
    <div className="question-set-item-editor">
      <Paper elevation={1} className="question-set-item-editor__container">
        <QuestionSetForm
          initialName={initialName}
          initialQuestionsJson={initialQuestionsJson}
          onSubmit={onSave}
          controls={formControls}
          renderPreview={renderPreview}
        />
      </Paper>
    </div>
  )
}

QuestionSetItemEditor.propTypes = {
  initialName: PropTypes.string,
  initialQuestionsJson: PropTypes.string,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  renderPreview: PropTypes.func,
}

export default QuestionSetItemEditor
