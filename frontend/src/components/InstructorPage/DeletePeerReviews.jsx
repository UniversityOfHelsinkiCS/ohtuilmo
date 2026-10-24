import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import DeleteIcon from '@mui/icons-material/Delete'

import { extractCallingName } from '../../utils/functions'

const studentName = ({ first_names, last_name }) =>
  `${extractCallingName(first_names)} ${last_name}`

// Admins can delete the peer review of a student, e.g. one sent by mistake. The deletion
// can not be undone, so it has to be confirmed by typing the name of the student.
const DeletePeerReviews = ({ answers, round, groupName, onDelete }) => {
  const [answerToDelete, setAnswerToDelete] = useState(null)
  const [typedName, setTypedName] = useState('')

  const name = answerToDelete ? studentName(answerToDelete.student) : ''
  const nameMatches = typedName.trim() === name

  const close = () => {
    setAnswerToDelete(null)
    setTypedName('')
  }

  const confirm = () => {
    const answer = answerToDelete
    close()
    onDelete(answer)
  }

  return (
    <div className="delete-peer-reviews">
      <span>Delete the review of:</span>
      {answers.map((answer) => (
        <Button
          key={answer.id}
          data-cy="delete-peer-review"
          size="small"
          color="error"
          variant="outlined"
          startIcon={<DeleteIcon />}
          onClick={() => setAnswerToDelete(answer)}
        >
          {studentName(answer.student)}
        </Button>
      ))}
      <Dialog open={answerToDelete !== null} onClose={close} data-cy="delete-peer-review-dialog">
        <DialogTitle>Delete peer review permanently?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are deleting the round {round} peer review of <strong>{name}</strong> in the group{' '}
            <strong>{groupName}</strong>. The review can not be restored. If the peer review is
            still open, the student can answer it again.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Type <strong>{name}</strong> to confirm.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Student's name"
            value={typedName}
            onChange={(event) => setTypedName(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button color="error" variant="contained" disabled={!nameMatches} onClick={confirm}>
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

DeletePeerReviews.propTypes = {
  answers: PropTypes.array.isRequired,
  round: PropTypes.number.isRequired,
  groupName: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
}

export default DeletePeerReviews
