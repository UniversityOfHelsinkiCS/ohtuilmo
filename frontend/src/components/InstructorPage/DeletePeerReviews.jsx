import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import DeleteIcon from '@mui/icons-material/Delete'

import { extractCallingName } from '../../utils/functions'

const studentName = ({ first_names, last_name }) =>
  `${extractCallingName(first_names)} ${last_name}`

// the theme makes the background of all buttons transparent, which would hide the white
// text of this button
const deleteButtonStyle = {
  bgcolor: 'error.main',
  '&:hover': { bgcolor: 'error.dark' },
  '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
}

// Admins can delete the peer review of a student while the peer review is open, so that
// the student can answer again. The deletion can not be undone, so it has to be confirmed
// by typing the name of the student.
const DeletePeerReviews = ({ answers, round, groupName, onDelete }) => {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [typedName, setTypedName] = useState('')

  const selected = answers.find((answer) => answer.id === selectedId)
  const name = selected ? studentName(selected.student) : ''
  const nameMatches = !!selected && typedName.trim() === name

  const close = () => {
    setOpen(false)
    setSelectedId(null)
    setTypedName('')
  }

  const select = (id) => {
    setSelectedId(id)
    setTypedName('')
  }

  const confirm = () => {
    close()
    onDelete(selected)
  }

  return (
    <div>
      <Button
        data-cy="delete-peer-review"
        size="small"
        color="error"
        variant="outlined"
        startIcon={<DeleteIcon />}
        onClick={() => setOpen(true)}
      >
        Delete a peer review
      </Button>
      <Dialog open={open} onClose={close} data-cy="delete-peer-review-dialog">
        <DialogTitle>Delete a peer review permanently</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Choose the student whose round {round} peer review in the group{' '}
            <strong>{groupName}</strong> is deleted. The review can not be restored, the student can
            answer the peer review again.
          </DialogContentText>
          <RadioGroup
            value={selectedId ?? ''}
            onChange={(event) => select(Number(event.target.value))}
          >
            {answers.map((answer) => (
              <FormControlLabel
                key={answer.id}
                value={answer.id}
                control={<Radio />}
                label={studentName(answer.student)}
              />
            ))}
          </RadioGroup>
          {selected && (
            <>
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
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={close}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            sx={deleteButtonStyle}
            disabled={!nameMatches}
            onClick={confirm}
          >
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
