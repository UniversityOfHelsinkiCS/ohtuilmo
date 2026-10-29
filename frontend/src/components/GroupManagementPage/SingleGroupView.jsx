import { Link } from 'react-router-dom'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'

import groupManagementService from '../../services/groupManagement'

const SingleGroupView = ({
  group,
  topics,
  users,
  deleteFromGroupAction,
  toggleEditMode,
  setSuccess,
  setError,
}) => {
  const thisTopic = topics.filter((topic) => topic.id === group.topicId)

  const topicName = thisTopic[0].content.title

  const getUserNames = (user) => {
    const namedUser = users.filter((userIterator) => userIterator.student_number === user)[0]
    return `${namedUser.first_names} ${namedUser.last_name} (${user})`
  }

  const getGroupInstructor = () => {
    if (group.instructorId === null) {
      return <div>No instructor assigned</div>
    } else {
      return (
        <div>
          {getUserNames(group.instructorId)}
          <IconButton
            aria-label="Delete"
            onClick={(event) =>
              deleteFromGroupInstructor(event, {
                group,
                deleteFromGroupAction,
                setSuccess,
                setError,
              })
            }
            data-cy="delete-instructor-button"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      )
    }
  }

  return (
    <div style={{ align: 'top', minWidth: '400px' }}>
      <div className="group-name">{group.name}</div>

      <div>
        <div className="group-topic">
          <p>Topic</p>
          <Link to={`/topics/${group.topicId}`}>{topicName}</Link>
        </div>

        <div className="group-topic">
          <p>Project length</p>
          {group.isShortProject ? 'short' : 'long'}
        </div>

        <div className="group-students">
          <p>Students</p>

          {group.studentIds.map((student) => (
            <div key={student}>
              {getUserNames(student)}

              <IconButton
                aria-label="Delete"
                onClick={(event) =>
                  deleteFromGroupStudent(event, {
                    group,
                    student,
                    deleteFromGroupAction,
                    setSuccess,
                    setError,
                  })
                }
                data-cy="delete-student-button"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </div>
          ))}
        </div>

        <div className="group-instructor">
          <p>Instructor</p>
          {getGroupInstructor(group.id)}
        </div>
      </div>

      <Button
        style={{ marginLeft: '10px', height: '30px', float: 'right' }}
        color="primary"
        variant="contained"
        onClick={() => toggleEditMode()}
        data-cy="edit-group-button"
      >
        Edit
      </Button>
    </div>
  )
}

const deleteFromGroupStudent = async (event, props) => {
  event.preventDefault()

  const confirm = window.confirm(
    `Are you sure you want to delete student ${props.student} from a group ${props.group.name}? `,
  )

  if (!confirm) {
    return
  }

  const { id, name, topicId, studentIds, instructorId, isShortProject, configurationId } =
    props.group

  const removedStudents = studentIds
    .map((studentmap) => studentmap.trim())
    .filter((studentmap) => studentmap !== props.student)

  try {
    const updatedGroup = await groupManagementService.put({
      id: id,
      name: name,
      topicId: topicId,
      configurationId: configurationId,
      instructorId: instructorId,
      isShortProject: isShortProject,
      studentIds: removedStudents,
    })
    props.deleteFromGroupAction(updatedGroup)

    props.setSuccess('Student deleted!')
  } catch (e) {
    console.log(e)
    props.setError(`Failed to deleted student! ${e.response.data.error}`)
  }
}

const deleteFromGroupInstructor = async (event, props) => {
  event.preventDefault()

  const confirm = window.confirm(
    `Are you sure you want to delete instructor ${
      props.group.instructorId
    } from a group ${props.group.name}? `,
  )

  if (!confirm) {
    return
  }

  const { id, name, topicId, studentIds, configurationId, isShortProject } = props.group

  try {
    const updatedGroup = await groupManagementService.put({
      id: id,
      name: name,
      topicId: topicId,
      configurationId: configurationId,
      instructorId: '',
      isShortProject,
      studentIds: studentIds,
    })
    props.deleteFromGroupAction(updatedGroup)

    props.setSuccess('Instructor deleted!')
  } catch (e) {
    console.log(e)
    props.setError(`Failed to delete instructor! ${e.response.data.error}`)
  }
}

export default SingleGroupView
