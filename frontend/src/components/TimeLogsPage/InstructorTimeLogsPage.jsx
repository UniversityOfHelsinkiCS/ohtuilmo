import { withRouter } from '../../utils/withRouter'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { connect } from 'react-redux'
import { StudentSelectionForm } from '../common/StudentSelectionForm'
import { TimeLogRow } from './TimeLogRow'
import TimeLogChart from './TimeLogChart'
import LoadingSpinner from '../common/LoadingSpinner'
import { SprintSelect } from './SprintSelect'
import ConfirmationDialog from '../common/ConfirmationDialog'

import { Typography } from '@mui/material'
import Button from '@mui/material/Button'

import userService from '../../services/user'
import sprintService from '../../services/sprints'
import configurationService from '../../services/configuration'
import registrationManagementService from '../../services/registrationManagement'
import groupManagementService from '../../services/groupManagement'
import timeLogsService from '../../services/timeLogs'
import instructorTimeLogsService from '../../services/instructorTimeLogs'

import * as notificationActions from '../../reducers/actions/notificationActions'
import timeLogsActions from '../../reducers/actions/timeLogsActions'

const InstructorTimeLogsPage = (props) => {
  const {
    setError,
    setSuccess,
    selectedSprintNumber,
    setSelectedSprintNumber,
    setGroupSprintSummary,
    resetGroupSprintSummary,
    user,
  } = props

  const [searchParams, setSearchParams] = useSearchParams()

  const [allConfigurations, setAllConfigurations] = useState([])
  const [selectedConfigurationId, setSelectedConfigurationId] = useState(
    () => Number(searchParams.get('configuration')) || 0,
  )
  const [allGroups, setAllGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(
    () => Number(searchParams.get('group')) || 0,
  )
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [allStudents, setAllStudents] = useState([])
  const [allSprints, setAllSprints] = useState([])
  const [selectedStudentNumber, setSelectedStudentNumber] = useState(
    () => searchParams.get('student') || 0,
  )
  const [selectionInitialized, setSelectionInitialized] = useState(false)
  const [allLogs, setAllLogs] = useState(null)
  const [checkedTimeLogs, setCheckedTimeLogs] = useState([])
  const [moveToPreviousSprintConfirmOpen, setMoveToPreviousSprintConfirmOpen] = useState(false)
  const [moveToNextSprintConfirmOpen, setMoveToNextSprintConfirmOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const possibleSprintNumbers = allSprints.map((sprint) => sprint.sprint).sort((a, b) => a - b)

  useEffect(() => {
    const fetchCurrentConfigurationId = async () => {
      try {
        const { registrationManagement } = await registrationManagementService.get()
        return registrationManagement.peer_review_conf
      } catch {
        return null
      }
    }

    const fetchAllConfigurations = async () => {
      try {
        const allConfigurations = await configurationService.getAll()
        const currentConfigurationId = await fetchCurrentConfigurationId()
        // current configuration first, then the rest from newest to oldest
        const sortedConfigurations = [...allConfigurations.configurations].sort((a, b) => {
          if (a.id === currentConfigurationId) return -1
          if (b.id === currentConfigurationId) return 1
          return b.id - a.id
        })
        setAllConfigurations(sortedConfigurations)
      } catch (error) {
        console.error('Error fetching groups:', error.message, ' / ', error.response.data.error)
        setError(error.response.data.error)
      }
    }

    const fetchAllGroups = async () => {
      try {
        const allGroups = await groupManagementService.get()
        setAllGroups(allGroups)
      } catch (error) {
        console.error('Error fetching groups:', error.message, ' / ', error.response.data.error)
        setError(error.response.data.error)
      }
    }

    const fetchAllStudents = async () => {
      try {
        const allStudents = await userService.get()
        setAllStudents(allStudents)
      } catch (error) {
        console.error('Error fetching students:', error.message, ' / ', error.response.data.error)
        setError(error.response.data.error)
      }
    }

    const fetchAllLogs = async () => {
      try {
        const allLogs = await instructorTimeLogsService.getTimeLogs()
        setAllLogs(allLogs)
      } catch (error) {
        console.error('Error fetching logs:', error.message, ' / ', error.response.data.error)
        setError(error.response.data.error)
      }
    }

    const fetchData = async () => {
      setIsLoading(true)
      await fetchAllConfigurations()
      await fetchAllGroups()
      await fetchAllStudents()
      await fetchAllLogs()
      setIsLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (allConfigurations.length > 0 && allGroups.length > 0) {
      // selection given in the url takes precedence over the default selection
      const groupFromUrl = allGroups.find((group) => group.id === selectedGroupId)
      if (groupFromUrl) {
        setSelectedConfigurationId(groupFromUrl.configurationId)
        setSelectedGroup(groupFromUrl)
        setSelectionInitialized(true)
        return
      }
      if (selectedConfigurationId && !selectedGroupId) {
        setSelectedStudentNumber(0)
        setSelectionInitialized(true)
        return
      }

      const allGroupsInSortedOrder = [...allGroups] // clones the array
      allGroupsInSortedOrder.sort((a, b) => a.id - b.id)
      const newestGroupByInstructor = allGroupsInSortedOrder.findLast(
        (group) => group.instructorId === user.user.student_number,
      )
      const configurationByInstructor = allConfigurations.find(
        (configuration) => newestGroupByInstructor?.configurationId === configuration.id,
      )
      setSelectedConfigurationId(configurationByInstructor?.id ?? 0)
      setSelectedGroupId(newestGroupByInstructor?.id ?? 0)
      setSelectedGroup(newestGroupByInstructor?.id ? newestGroupByInstructor : null)
      setSelectedStudentNumber(0)
      setSelectionInitialized(true)
    }
  }, [allConfigurations, allGroups])

  useEffect(() => {
    if (!selectionInitialized) return
    const params = {}
    if (selectedConfigurationId) params.configuration = selectedConfigurationId
    if (selectedGroupId) params.group = selectedGroupId
    if (selectedStudentNumber) params.student = selectedStudentNumber
    setSearchParams(params, { replace: true })
  }, [selectionInitialized, selectedConfigurationId, selectedGroupId, selectedStudentNumber])

  useEffect(() => {
    const fetchGroupSprintSummary = async (group_id) => {
      try {
        const summaryData = await timeLogsService.getGroupSprintSummary(group_id)
        setGroupSprintSummary(JSON.parse(summaryData))
      } catch (error) {
        console.error(
          'Error fetching group sprint summary:',
          error.message,
          ' / ',
          error.response.data.error,
        )
        setError(error.response.data.error)
        resetGroupSprintSummary()
      }
    }

    const fetchSprintData = async (group_id) => {
      try {
        const sprintData = await sprintService.getSprintsByGroup(group_id)
        setAllSprints(sprintData)

        const today = new Date()
        const currentSprintObject = sprintData.find((sprint) => {
          const start = new Date(sprint.start_date)
          const end = new Date(sprint.end_date)

          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)

          return today >= start && today <= end
        })

        if (currentSprintObject) {
          setSelectedSprintNumber(currentSprintObject.sprint)
        } else {
          setSelectedSprintNumber(sprintData.length)
        }
      } catch (error) {
        console.error('Error fetching all sprints:', error.message, ' / ', error.message.data.error)
        setError(error.response.data.error)
      }
    }

    const fetchChartData = async (selectedGroupId) => {
      setIsLoading(true)
      await fetchGroupSprintSummary(selectedGroupId)
      await fetchSprintData(selectedGroupId)
      setIsLoading(false)
    }
    if (selectedGroupId) fetchChartData(selectedGroupId)
  }, [selectedGroupId])

  const handleTimeLogCheck = (logId) => {
    setCheckedTimeLogs((prevChecked) =>
      prevChecked.includes(logId)
        ? prevChecked.filter((id) => id !== logId)
        : [...prevChecked, logId],
    )
  }

  const handleMoveTimeLog = async (direction) => {
    if (checkedTimeLogs.length === 0) {
      setError('No time logs selected')
      return
    }
    for (const logId in checkedTimeLogs) {
      try {
        const updatedLogs = await instructorTimeLogsService.moveTimeLog(
          direction,
          checkedTimeLogs[logId],
        )
        setAllLogs(updatedLogs)
        setSuccess('Selected time logs moved successfully')
        setCheckedTimeLogs([])
      } catch (error) {
        console.error('Error moving time log:', error.message, ' / ', error.response.data.error)
        setError(error.response.data.error)
      }
    }
  }

  const handleDelete = async (logId) => {
    try {
      const updatedLogs = await instructorTimeLogsService.deleteTimeLog(logId)
      setAllLogs(updatedLogs)
      setSuccess('Time log deleted successfully')
    } catch {
      setError('Error deleting time log')
    }
  }

  const previousSprint = [...possibleSprintNumbers]
    .reverse()
    .find((sprint) => sprint < selectedSprintNumber)

  const nextSprint = possibleSprintNumbers.find((sprint) => sprint > selectedSprintNumber)

  const selectedSprintData = allSprints.find((sprint) => sprint.sprint === selectedSprintNumber)

  const formatSprintDate = (sprintDate) => {
    const dateObj = new Date(sprintDate)
    const formattedSprintDate = dateObj
      .toLocaleDateString('fi-FI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\./g, '/')
    return formattedSprintDate
  }

  const handleClickNextSprint = () => {
    setSelectedSprintNumber(nextSprint !== undefined ? nextSprint : selectedSprintNumber)
    setCheckedTimeLogs([])
  }

  const handleClickPreviousSprint = () => {
    setSelectedSprintNumber(previousSprint !== undefined ? previousSprint : selectedSprintNumber)
    setCheckedTimeLogs([])
  }

  const handleStudentChange = (studentNumber) => {
    setSelectedStudentNumber(studentNumber)
    setCheckedTimeLogs([])
  }

  const isLogs = (logs) => logs && logs.length > 0
  const logsByStudentAndSelectedSprint =
    isLogs(allLogs) &&
    allLogs.filter(
      (log) => log.studentNumber === selectedStudentNumber && log.sprint === selectedSprintNumber,
    )

  if (isLoading) return <LoadingSpinner />

  const handleConfigurationChange = (configuration_id) => {
    const configurationById = allConfigurations.find((conf) => conf.id === configuration_id)
    setSelectedConfigurationId(configurationById.id ?? 0)
  }

  const handleGroupChange = (group_id) => {
    const groupById = allGroups.find((grp) => grp.id === group_id)
    setSelectedGroupId(groupById?.id ?? 0)
    setSelectedGroup(groupById?.id ? groupById : null)
  }

  return (
    <div className="timelogs-responsive-grid">
      <div id="timelogs-container-1">
        <div>
          <StudentSelectionForm
            configurations={allConfigurations}
            selectedConfigurationId={selectedConfigurationId}
            handleConfigurationChange={handleConfigurationChange}
            groups={allGroups}
            selectedGroupId={selectedGroupId}
            handleGroupChange={handleGroupChange}
            students={allStudents}
            selectedStudentNumber={selectedStudentNumber}
            handleStudentNumberChange={handleStudentChange}
          />
          {selectedGroupId !== 0 && (
            <div>
              <Typography variant="h5">Timelogs by {selectedGroup?.name}</Typography>
              <SprintSelect
                sprintNumber={selectedSprintNumber}
                handleClickNextSprint={handleClickNextSprint}
                handleClickPreviousSprint={handleClickPreviousSprint}
                nextSprintButtonDisabled={nextSprint === undefined}
                previousSprintButtonDisabled={previousSprint === undefined}
              />
              {allSprints && selectedSprintData && (
                <p>
                  {formatSprintDate(selectedSprintData.start_date)} -{' '}
                  {formatSprintDate(selectedSprintData.end_date)}
                </p>
              )}
            </div>
          )}
        </div>
        <div id="timelog-rows">
          {isLogs(logsByStudentAndSelectedSprint) && checkedTimeLogs.length > 0 && (
            <div style={{ paddingTop: 25, paddingBottom: 25 }}>
              <span className="text" style={{ paddingRight: 12 }}>
                Move selected logs to
              </span>
              <Button
                variant="outlined"
                size="small"
                id={'timelog-move-button-previous'}
                className="timelog-move-button"
                style={{ padding: '0 12px', marginRight: '12px' }}
                disableRipple
                onClick={() => setMoveToPreviousSprintConfirmOpen(true)}
              >
                previous sprint
              </Button>
              <ConfirmationDialog
                title="Move Time Logs?"
                open={moveToPreviousSprintConfirmOpen}
                setOpen={setMoveToPreviousSprintConfirmOpen}
                onConfirm={() => handleMoveTimeLog('previous')}
              >
                Move selected time logs to previous sprint?
              </ConfirmationDialog>
              <Button
                variant="outlined"
                size="small"
                id={'timelog-move-button-next'}
                className="timelog-move-button"
                style={{ padding: '0 12px' }}
                disableRipple
                onClick={() => setMoveToNextSprintConfirmOpen(true)}
              >
                next sprint
              </Button>
              <ConfirmationDialog
                title="Move Time Logs?"
                open={moveToNextSprintConfirmOpen}
                setOpen={setMoveToNextSprintConfirmOpen}
                onConfirm={() => handleMoveTimeLog('next')}
              >
                Move selected time logs to next sprint?
              </ConfirmationDialog>
            </div>
          )}
          {isLogs(logsByStudentAndSelectedSprint) &&
            logsByStudentAndSelectedSprint.map((log) => (
              <TimeLogRow
                key={log.id}
                log={log}
                handleDelete={() => handleDelete(log.id)}
                handleTimeLogCheck={() => handleTimeLogCheck(log.id)}
                isChecked={checkedTimeLogs.includes(log.id)}
                user={user.user}
              />
            ))}
          {!isLogs(logsByStudentAndSelectedSprint) && <p>No logs for the selected sprint.</p>}
        </div>
      </div>
      <div id="chart-container">
        {selectedGroupId !== 0 && (
          <div className="timelogs-charts-container">
            <div className="timelogs-chart-and-title-container">
              <Typography variant="h5">Sprint Chart</Typography>
              <TimeLogChart chartVariant="sprint" />
            </div>
            <div className="timelogs-chart-and-title-container">
              <Typography variant="h5">Project Chart</Typography>
              <TimeLogChart chartVariant="total" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const mapStateToProps = (state) => ({
  state: state,
  selectedSprintNumber: state.timeLogs.selectedSprintNumber,
  user: state.login.user,
})

const mapDispatchToProps = {
  setError: notificationActions.setError,
  setSuccess: notificationActions.setSuccess,
  setGroupSprintSummary: timeLogsActions.setGroupSprintSummary,
  resetGroupSprintSummary: timeLogsActions.resetGroupSprintSummary,
  setSelectedSprintNumber: timeLogsActions.setSelectedSprintNumber,
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(InstructorTimeLogsPage))
