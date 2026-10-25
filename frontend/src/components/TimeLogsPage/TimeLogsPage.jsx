import { withRouter } from '../../utils/withRouter'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'

import { TimeLogForm } from './TimeLogForm'
import { TimeLogRow } from './TimeLogRow'
import TimeLogChart from './TimeLogChart'
import { NotInGroupPlaceholder, NoSprintsPlaceholder } from '../common/Placeholders'
import LoadingSpinner from '../common/LoadingSpinner'
import { SprintSelect } from './SprintSelect'
import { Container, Typography } from '@mui/material'
import Error from '@mui/icons-material/Error'

// services
import timeLogsService from '../../services/timeLogs'
import sprintService from '../../services/sprints'
import tagService from '../../services/tags'

// actions
import { minutesAndHoursFromString, hoursAndMinutesToMinutes } from '../../utils/functions'
import './TimeLogsPage.css'
import * as notificationActions from '../../reducers/actions/notificationActions'
import timeLogsActions from '../../reducers/actions/timeLogsActions'
import AIUsageContainer from './UserAIUsageContainer'

const TimeLogsPage = (props) => {
  const {
    currentSprintNumber,
    selectedSprintNumber,
    setCurrentSprintNumber,
    setSelectedSprintNumber,
    setGroupSprintSummary,
    user,
    group,
  } = props

  const [allLogs, setAllLogs] = useState([])
  const [allSprints, setAllSprints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [availableTags, setAvailableTags] = useState([])

  const existingSprintNumbers = allSprints.map((sprint) => sprint.sprint).sort((a, b) => a - b)

  useEffect(() => {
    const fetchTimeLogs = async () => {
      try {
        const logs = await timeLogsService.getTimeLogs()
        setAllLogs(logs)
      } catch (error) {
        console.error('Error fetching timelogs:', error.message, ' / ', error.response.data.error)
        notificationActions.setError(error.response.data.error)
      }
    }
    const fetchSprints = async () => {
      try {
        const fetchedData = await sprintService.getSprints()
        setAllSprints(fetchedData)
      } catch (error) {
        console.error('Error fetching sprints:', error.message, ' / ', error.response.data.error)
        notificationActions.setError(error.response.data.error)
      }
    }
    const fetchGroupSprintSummary = async (id) => {
      try {
        const summaryData = await timeLogsService.getGroupSprintSummary(id)
        setGroupSprintSummary(JSON.parse(summaryData))
      } catch (error) {
        console.error(
          'Error fetching group sprint summary:',
          error.message,
          ' / ',
          error.response.data.error,
        )
        notificationActions.setError(error.response.data.error)
      }
    }
    const fetchTags = async () => {
      try {
        const rawTagData = await tagService.getTags()
        const availableTagData = rawTagData.map((tag) => tag.title)
        setAvailableTags(availableTagData)
      } catch (error) {
        console.error('Error fetching tags:', error.message, ' / ', error.response.data.error)
        notificationActions.setError(error.response.data.error)
      }
    }
    const fetchData = async () => {
      setIsLoading(true)
      if (group?.id) await fetchSprints()
      await fetchTimeLogs()
      if (group?.id) await fetchGroupSprintSummary(group.id)
      await fetchTags()
      setIsLoading(false)
    }

    fetchData()
  }, [setGroupSprintSummary])

  useEffect(() => {
    const today = new Date()
    const currentSprintObject = allSprints.find((sprint) => {
      const start = new Date(sprint.start_date)
      const end = new Date(sprint.end_date)

      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      return today >= start && today <= end
    })

    if (currentSprintObject) {
      setCurrentSprintNumber(currentSprintObject.sprint)
      setSelectedSprintNumber(currentSprintObject.sprint)
    } else {
      setSelectedSprintNumber(
        existingSprintNumbers.length > 0 ? existingSprintNumbers.at(-1) : null,
      )
    }
  }, [allSprints])

  const handleSubmit = async (date, time, description, tags) => {
    const log = {
      studentNumber: user.studentNumber,
      sprint: selectedSprintNumber,
      date,
      minutes: hoursAndMinutesToMinutes(minutesAndHoursFromString(time)),
      description,
      tags: tags,
      groupId: group.id,
    }
    try {
      const updatedLogs = await timeLogsService.createTimeLog(log)
      setAllLogs(updatedLogs)
      const summaryData = await timeLogsService.getGroupSprintSummary(group.id)
      setGroupSprintSummary(JSON.parse(summaryData))
      props.setSuccess('Time log created successfully')
    } catch (error) {
      console.error('Error creating time log:', error.message, ' / ', error.response.data.error)
      props.setError(error.response.data.error)
    }
  }

  const handleDelete = async (logId) => {
    try {
      const updatedLogs = await timeLogsService.deleteTimeLog(logId)
      setAllLogs(updatedLogs)
      props.setSuccess('Time log deleted successfully')
    } catch (error) {
      console.error('Error deleting time log:', error.message, ' / ', error.response.data.error)
      props.setError(error.response.data.error)
    }
  }

  const previousSprint = [...existingSprintNumbers]
    .reverse()
    .find((sprint) => sprint < selectedSprintNumber)

  const nextSprint = existingSprintNumbers.find((sprint) => sprint > selectedSprintNumber)

  const handleClickNextSprint = () => {
    setSelectedSprintNumber(nextSprint !== undefined ? nextSprint : selectedSprintNumber)
  }

  const handleClickPreviousSprint = () => {
    setSelectedSprintNumber(previousSprint !== undefined ? previousSprint : selectedSprintNumber)
  }

  const isLogs = (logs) => logs && logs.length > 0

  const logsBySprint =
    isLogs(allLogs) && allLogs.filter((log) => log.sprint === selectedSprintNumber)

  if (isLoading) return <LoadingSpinner />
  if (!group) return <NotInGroupPlaceholder />
  if (allSprints.length === 0) return <NoSprintsPlaceholder />

  return (
    <Container>
      <div className="timelogs-responsive-grid">
        <div className="timelogs-container-1">
          <div className="timelogs-container-2">
            <div className="timelogs-container-3">
              <Typography variant="h4">Time Logs</Typography>
              <SprintSelect
                sprintNumber={selectedSprintNumber}
                handleClickNextSprint={handleClickNextSprint}
                handleClickPreviousSprint={handleClickPreviousSprint}
                nextSprintButtonDisabled={nextSprint === undefined}
                previousSprintButtonDisabled={previousSprint === undefined}
              />
            </div>
            <TimeLogForm
              handleSubmit={handleSubmit}
              disabled={selectedSprintNumber !== currentSprintNumber}
              availableTags={availableTags}
            />
            <div id="timelog-rows">
              {isLogs(logsBySprint) &&
                logsBySprint.map((log) => (
                  <TimeLogRow
                    key={log.id}
                    log={log}
                    handleDelete={() => handleDelete(log.id)}
                    user={user}
                  />
                ))}
              {!isLogs(logsBySprint) && allSprints.length > 0 && (
                <p className="timelogs-not-available-message-and-icon">
                  <Error />
                  There are no time logs for this sprint.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="timelogs-charts-container">
          <div className="timelogs-chart-and-title-container">
            <Typography variant="h5">Sprint Chart</Typography>
            <TimeLogChart chartVariant="sprint" isShortProject={group.isShortProject} />
          </div>
          <div className="timelogs-chart-and-title-container">
            <Typography variant="h5">Project Chart</Typography>
            <TimeLogChart chartVariant="total" isShortProject={group.isShortProject} />
          </div>
        </div>
      </div>
      <AIUsageContainer
        currentSprint={currentSprintNumber}
        selected={selectedSprintNumber}
        user={user}
        groupId={group.id}
      />
    </Container>
  )
}

const mapStateToProps = (state) => ({
  state: state,
  user: {
    studentNumber: state.login.user.user.student_number,
    admin: state.login.user.user.admin,
    instructor: state.login.user.user.instructor,
    name: `${state.login.user.user.first_name} ${state.login.user.user.last_name}`,
  },
  currentSprintNumber: state.timeLogs.currentSprintNumber,
  selectedSprintNumber: state.timeLogs.selectedSprintNumber,
  group: state.registrationDetails.myGroup,
})

const mapDispatchToProps = {
  setError: notificationActions.setError,
  setSuccess: notificationActions.setSuccess,
  setCurrentSprintNumber: timeLogsActions.setCurrentSprintNumber,
  setSelectedSprintNumber: timeLogsActions.setSelectedSprintNumber,
  setGroupSprintSummary: timeLogsActions.setGroupSprintSummary,
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TimeLogsPage))
