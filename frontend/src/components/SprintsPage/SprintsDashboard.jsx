import { withRouter } from '../../utils/withRouter'
import React, { useState, useEffect } from 'react'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { Table, TableRow, TableHead, TableBody, TableCell } from '@mui/material'
import sprintService from '../../services/sprints'
import { NotInGroupPlaceholder } from '../common/Placeholders'
import './SprintsDashboard.css'
import { connect } from 'react-redux'

import * as notificationActions from '../../reducers/actions/notificationActions'

const SprintsPage = (props) => {
  const [allSprints, setAllSprints] = useState([])
  const [sprintNumber, setSprintNumber] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { group, studentNumber } = props

  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const fetchedData = await sprintService.getSprints()
        setAllSprints(fetchedData)
      } catch (error) {
        console.error('Error fetching sprints:', error)
      }
    }

    fetchSprints()
  }, [])

  const handleAddSprint = async () => {
    const sprint = {
      start_date: startDate,
      end_date: endDate,
      sprint: parseInt(sprintNumber, 10),
      user_id: studentNumber,
    }

    try {
      const updatedSprints = await sprintService.createSprint(sprint)
      setAllSprints(updatedSprints)
      clearForm()
      props.setSuccess('Sprint added successfully!')
    } catch (error) {
      console.error('Error creating sprint:', error)
      props.setError(error.response.data.error)
    }
  }

  const clearForm = () => {
    setSprintNumber('')
    setStartDate('')
    setEndDate('')
  }

  const handleDeleteSprint = async (sprintId) => {
    try {
      const updatedSprints = await sprintService.deleteSprint(sprintId)
      setAllSprints(updatedSprints)
      props.setSuccess('Sprint deleted successfully!')
    } catch (error) {
      console.error('Error message:', error.response.data.error)
      props.setError(error.response.data.error)
    }
  }

  if (!group) return <NotInGroupPlaceholder />

  return (
    <div className="sprints-container">
      <Typography variant="h4">Add new sprint</Typography>
      <div className="spacer"></div>
      <div className="add-sprint-container">
        <TextField
          className="sprint-number"
          id="sprintNumber"
          label="Sprint Number"
          aria-describedby="sprintNumber"
          type="number"
          value={sprintNumber}
          onChange={(e) => setSprintNumber(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          variant="outlined"
        />
        <TextField
          className="date"
          id="startDate"
          type="date"
          label="Start Date"
          aria-describedby="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          variant="outlined"
        />
        <TextField
          className="date"
          id="endDate"
          type="date"
          label="End Date"
          aria-describedby="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          variant="outlined"
        />
      </div>
      <Button
        id="add-sprint-button"
        variant="contained"
        className="button"
        onClick={handleAddSprint}
        style={{
          backgroundColor: '#188433',
          color: 'white',
          borderRadius: '8px',
          boxShadow: 'none',
          fontWeight: 'bolder',
        }}
      >
        Add Sprint
      </Button>
      {allSprints.length > 0 && (
        <div className="sprint-list-container">
          <Table>
            <TableHead>
              <TableRow hover>
                <TableCell>Sprint Number</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody id="sprint-list-rows">
              {allSprints
                .sort((a, b) => b.sprint - a.sprint)
                .map((sprint) => {
                  const startDateObj = new Date(sprint.start_date)
                  const endDateObj = new Date(sprint.end_date)

                  const formattedStartDate = startDateObj
                    .toLocaleDateString('fi-FI', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                    .replace(/\./g, '/')

                  const formattedEndDate = endDateObj
                    .toLocaleDateString('fi-FI', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                    .replace(/\./g, '/')

                  return (
                    <TableRow hover key={sprint.id} data-cy={`sprint-${sprint.sprint}`}>
                      <TableCell className="sprint-list-sprint-number">{sprint.sprint}</TableCell>
                      <TableCell>{formattedStartDate}</TableCell>
                      <TableCell>{formattedEndDate}</TableCell>
                      <TableCell>
                        <Button
                          id={`sprint-remove-button-${sprint.id}`}
                          onClick={() => handleDeleteSprint(sprint.id)}
                          className="delete-sprint-button"
                          variant="contained"
                          color="secondary"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

const mapDispatchToProps = {
  setError: notificationActions.setError,
  setSuccess: notificationActions.setSuccess,
}

const mapStateToProps = (state) => ({
  studentNumber: state.login.user.user.student_number,
  group: state.registrationDetails.myGroup,
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SprintsPage))
