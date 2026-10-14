import React from 'react'
import { connect } from 'react-redux'
import Button from '@mui/material/Button'
import { createPeerReviewQuestionSet } from '../../reducers/actions/peerReviewQuestionsPageActions'
import { setError, setSuccess } from '../../reducers/actions/notificationActions'
import QuestionSetForm from '../QuestionSetForm'
import PeerReviewQuestionsPreview from './PeerReviewQuestionsPreview'

const isValidationError = (err) => err.response && err.response.status === 400

const CreatePeerReviewQuestionSet = ({ onCreateRequested, onSuccess, onError }) => {
  const handleError = (err) => {
    console.error('Error while creating peer review question set', err)

    if (isValidationError(err)) {
      onError(
        `An error occurred while creating peer review question set: ${err.response.data.error}`,
        5000,
      )
    } else {
      onError('Some error happened', 3000)
    }
  }

  const handleSubmit = async (name, questionsJson) => {
    try {
      await onCreateRequested(name, JSON.parse(questionsJson))
      onSuccess(`Created new peer review question set "${name}"`)
    } catch (err) {
      handleError(err)
    }
  }

  const submitButton = (
    <Button type="submit" variant="contained" color="primary">
      Create
    </Button>
  )

  return (
    <QuestionSetForm
      onSubmit={handleSubmit}
      controls={submitButton}
      renderPreview={(questions) => <PeerReviewQuestionsPreview questions={questions} />}
    />
  )
}

const mapDispatchToProps = {
  onCreateRequested: createPeerReviewQuestionSet,
  onSuccess: setSuccess,
  onError: setError,
}

export default connect(null, mapDispatchToProps)(CreatePeerReviewQuestionSet)
