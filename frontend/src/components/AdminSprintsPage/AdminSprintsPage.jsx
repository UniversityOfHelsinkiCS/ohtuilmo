import { withRouter } from '../../utils/withRouter'
import React, { useEffect, useState } from 'react'

import { connect } from 'react-redux'

import LoadingSpinner from '../common/LoadingSpinner'
import { SprintsSelectForm } from './SprintsSelectForm'
import { SprintListItem } from './SprintListItem'

import { Typography, Table, TableRow, TableBody, TableHead, TableCell } from '@mui/material'

import sprintService from '../../services/sprints'
import configurationService from '../../services/configuration'
import groupManagementService from '../../services/groupManagement'

import * as notificationActions from '../../reducers/actions/notificationActions'

const AdminSprintsPage = (props) => {
  const { setError, setSuccess } = props

  const [allConfigurations, setAllConfigurations] = useState([])
  const [allGroups, setAllGroups] = useState([])
  const [allSprints, setAllSprints] = useState([])
  const [selectedConfigurationId, setSelectedConfigurationId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')

  const selectedGroupObj = allGroups.find((g) => g.id === selectedGroupId)

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO set newest configuration by default
    const fetchAllConfigurations = async () => {
      try {
        const allConfigurations = await configurationService.getAll()
        setAllConfigurations(allConfigurations.configurations)
      } catch (error) {
        console.error('Error fetching groups:', error.message, ' / ', error.response.data.error)
        notificationActions.setError(error.response.data.error)
      }
    }

    const fetchAllGroups = async () => {
      try {
        const allGroups = await groupManagementService.get()
        setAllGroups(allGroups)
      } catch (error) {
        console.error('Error fetching groups:', error.message, ' / ', error.response.data.error)
        notificationActions.setError(error.response.data.error)
      }
    }
    const fetchData = async () => {
      setIsLoading(true)
      await fetchAllConfigurations()
      await fetchAllGroups()
      setIsLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchSprints = async (group_id) => {
      try {
        const sprintData = await sprintService.getSprintsByGroup(group_id)
        setAllSprints(sprintData)
      } catch (error) {
        console.error('Error fetching all sprints:', error.message, ' / ', error.message.data.error)
        notificationActions.setError(error.response.data.error)
      }
    }
    const fetchData = async (id) => {
      setIsLoading(true)
      await fetchSprints(id)
      setIsLoading(false)
    }
    if (selectedGroupId) fetchData(selectedGroupId)
  }, [selectedGroupId, selectedConfigurationId])

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <SprintsSelectForm
        configurations={allConfigurations}
        groups={allGroups}
        selectedConfigurationId={selectedConfigurationId}
        selectedGroupId={selectedGroupId}
        handleConfigurationChange={setSelectedConfigurationId}
        handleGroupChange={setSelectedGroupId}
      />
      {selectedGroupId !== '' && selectedGroupObj && (
        <div>
          <Typography variant="h5">Sprints by {selectedGroupObj.name}</Typography>
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
                      return (
                        <SprintListItem
                          sprint={sprint}
                          setError={setError}
                          setSuccess={setSuccess}
                          key={sprint.id}
                        />
                      )
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const mapStateToProps = (state) => ({
  state: state,
  user: state.login.user,
})

const mapDispatchToProps = {
  setError: notificationActions.setError,
  setSuccess: notificationActions.setSuccess,
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AdminSprintsPage))
