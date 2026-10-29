import { withRouter } from '../../utils/withRouter'
import { useEffect, useState } from 'react'
import { connect } from 'react-redux'

import LoadingSpinner from '../common/LoadingSpinner'
import { Typography, Container } from '@mui/material'
import { NotInGroupPlaceholder, NoSprintsPlaceholder } from '../common/Placeholders'
import CheckboxMultiSelect from '../common/CheckboxMultiSelect'
import TagUsageLineChart from './TagUsageLineChart'
import TagUsageBarChart from './TagUsageBarChart'

import sprintService from '../../services/sprints'
import tagService from '../../services/tags'
import * as notificationActions from '../../reducers/actions/notificationActions'
import tagsActions from '../../reducers/actions/tagActions'
import './TagPage.css'

const colourSet = [
  '#9258c8',
  '#3a75c4',
  '#8c0032',
  '#15bef0',
  '#00b08c',
  '#fca311',
  '#009e60',
  '#e5053a',
  '#5bbf21',
  '#00a39a',
  '#e63375',
  '#256ec7',
  '#e95c55',
  '#a3af07',
]

const StudentTagPage = (props) => {
  const { user, group, availableTags, fetchAvailableTags } = props

  const [isLoading, setIsLoading] = useState(true)
  const [allSprints, setAllSprints] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [studentTags, setStudentTags] = useState({})

  const tagColors = availableTags.reduce((acc, tag, index) => {
    acc[tag] = colourSet[index % colourSet.length]
    return acc
  }, {})

  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const fetchedData = await sprintService.getSprints()
        setAllSprints(fetchedData)
      } catch (error) {
        console.error('Error fetching sprints:', error.message, ' / ', error.response.data.error)
        notificationActions.setError(error.response.data.error)
      }
    }

    const fetchData = async () => {
      setIsLoading(true)
      if (group?.id) await fetchSprints()
      await tagService.getTagsByStudent(user.studentNumber).then((data) => {
        setStudentTags(data)
      })
      await fetchAvailableTags()
      setIsLoading(false)
    }

    fetchData()
  }, [fetchAvailableTags, user.studentNumber, group?.id])

  useEffect(() => {
    setSelectedTags(availableTags)
  }, [availableTags])

  if (isLoading) return <LoadingSpinner />
  if (!group) return <NotInGroupPlaceholder />
  if (allSprints.length === 0) return <NoSprintsPlaceholder />

  return (
    <Container>
      <div className="tagpage-container">
        <div className="tagpage-selection-container">
          <Typography variant="h5">Tags</Typography>
          <CheckboxMultiSelect
            allItems={availableTags}
            selectedItems={selectedTags}
            setSelectedItems={setSelectedTags}
          />
        </div>
        <div className="tagpage-charts-container">
          {selectedTags.length === 0 ? (
            <Typography variant="body1">No tags selected.</Typography>
          ) : (
            <>
              <TagUsageBarChart
                allTags={availableTags}
                selectedTags={selectedTags}
                tagData={studentTags}
                tagColors={tagColors}
              />
              <TagUsageLineChart
                allSprints={allSprints}
                allTags={availableTags}
                selectedTags={selectedTags}
                tagData={studentTags}
                tagColors={tagColors}
              />
            </>
          )}
        </div>
      </div>
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
  group: state.registrationDetails.myGroup,
  availableTags: state.tags.availableTags,
})

const mapDispatchToProps = {
  setError: notificationActions.setError,
  setSuccess: notificationActions.setSuccess,
  fetchAvailableTags: tagsActions.fetchAvailableTags,
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(StudentTagPage))
