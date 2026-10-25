import { withRouter } from '../utils/withRouter'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'

import { getUser } from '../utils/functions'

import questionsJson from './questions/instructor_data'
//Actions
import appActions from '../reducers/actions/appActions'
import * as notificationActions from '../reducers/actions/notificationActions'
import instructorReviewPageActions from '../reducers/actions/instructorReviewPageActions.js'

//Services
import TextField from '@mui/material/TextField'

import groupManagementService from '../services/groupManagement'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import CheckCircle from '@mui/icons-material/CheckCircle'
import ErrorOutline from '@mui/icons-material/ErrorOutlineOutlined'
import instructorReviewService from '../services/instructorReview'
import { problemsOfStudent, studentName } from './instructorReviewValidation'

// The answers are saved in the browser while writing, so that they are not lost if
// submitting fails, e.g. because the login session has expired.
const draftKey = (group) => `instructorReviewDraft:${getUser()?.student_number}:${group.id}`

const sameQuestions = (a, b) =>
  a.length === b.length &&
  a.every((question, i) => question.type === b[i].type && question.header === b[i].header)

// the draft is used only if it was saved for the same students and questions
const loadDraft = (key, answerSheet) => {
  try {
    const draft = JSON.parse(window.localStorage.getItem(key))
    const matches =
      Array.isArray(draft) &&
      draft.length === answerSheet.length &&
      draft.every(
        (student, i) =>
          studentName(student) === studentName(answerSheet[i]) &&
          sameQuestions(student.answers, answerSheet[i].answers),
      )
    return matches ? draft : null
  } catch {
    return null
  }
}

const saveDraft = (key, answerSheet) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(answerSheet))
  } catch {
    // storage full or disabled, the answers are still on the page
  }
}

const removeDraft = (key) => {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // storage disabled
  }
}

const emptyAnswerSheet = (students) => {
  const emptyAnswers = questionsJson.questions.map((question, questionId) =>
    question.type === 'text' || question.type === 'number'
      ? { type: question.type, header: question.header, id: questionId, answer: '' }
      : question,
  )
  return students.map((student) => ({ name: student, answers: emptyAnswers }))
}

class InstructorReviewPage extends React.Component {
  state = {
    notInstructing: false,
    // the problems are shown after the first submit and updated while answering
    showProblems: false,
    // incremented to open the incomplete reviews
    openIncomplete: 0,
  }

  async componentDidMount() {
    try {
      // the answers used to be saved under one key for all groups
      window.localStorage.removeItem('savedAnswerSheet')
    } catch {
      // storage disabled
    }
    try {
      await this.loadGroups()
    } catch (e) {
      console.error('Error happened:', e.response?.data?.error)
      this.props.setError('Something is wrong... try reloading the page')
    }
  }

  componentDidUpdate(prevProps) {
    const { answerSheet, groups, selectedGroup } = this.props
    if (answerSheet !== prevProps.answerSheet && answerSheet.length > 0 && groups[selectedGroup]) {
      saveDraft(draftKey(groups[selectedGroup]), answerSheet)
    }
  }

  // loads the instructed groups that have not been reviewed yet
  async loadGroups() {
    const groups = await groupManagementService.getByInstructor()
    if (groups.length === 0) {
      this.setState({ notInstructing: true })
      return
    }
    const answers = await instructorReviewService.getAllAnsweredGroupId()

    const filteredGroups = groups.filter((group) => {
      return !answers.includes(group.id)
    })
    if (filteredGroups.length === 0) {
      this.props.setSubmittedReview(true)
    } else {
      this.props.setGroups(filteredGroups)
      this.props.selectGroup(0)
      this.initializeGroup(filteredGroups[0])
    }
  }

  initializeGroup(group) {
    const empty = emptyAnswerSheet(group.students)
    this.props.initializeAnswerSheet(loadDraft(draftKey(group), empty) || empty)
    this.setState({ showProblems: false })
  }

  // the answers of the other groups are kept in their drafts
  changeGroup = (groupIndex) => {
    this.props.selectGroup(groupIndex)
    this.initializeGroup(this.props.groups[groupIndex])
  }

  Submit = async (event, answerSheet, group) => {
    event.preventDefault()

    const incomplete = answerSheet.filter(
      (student) => Object.keys(problemsOfStudent(student)).length > 0,
    )
    if (incomplete.length > 0) {
      this.props.setError(
        `Reviews are incomplete: ${incomplete.map(studentName).join(', ')}`,
        10000,
      )
      this.setState((state) => ({ showProblems: true, openIncomplete: state.openIncomplete + 1 }))
      return
    }

    const answer = window.confirm('Answers can not be changed after submitting. Continue?')
    if (!answer) return
    try {
      await instructorReviewService.create({
        instructorReview: {
          group_id: group.id,
          group_name: group.groupName,
          answer_sheet: answerSheet,
          user_id: getUser().student_number,
        },
      })
      removeDraft(draftKey(group))

      this.props.setSuccess('Instructor review saved!')

      await this.loadGroups()
    } catch (e) {
      console.log('error happened', e)
      // no response: an expired Shibboleth session redirects the request to the login page
      if (!e.response || e.response.status === 401) {
        this.props.setError(
          'Your session has expired. Your answers are saved in this browser, reload the page and submit again.',
          60000,
        )
      } else {
        this.props.setError(e.response.data?.error || 'Saving failed, please try again.')
      }
    }
  }

  render() {
    const { answerSheet, updateAnswer, submittedReview, groups, selectedGroup } = this.props

    if (this.state.notInstructing) {
      return (
        <div>
          <h3>You are not instructing any groups.</h3>
        </div>
      )
    } else if (submittedReview === true) {
      return (
        <div>
          <h3>You have reviewed every group you are instructing.</h3>
        </div>
      )
    } else if (answerSheet && groups.length > 0) {
      return (
        <div>
          <ConfigurationSelectWrapper label="Select group">
            <ConfigurationSelect
              selectedGroup={selectedGroup}
              groups={groups}
              changeGroup={this.changeGroup}
            />
          </ConfigurationSelectWrapper>
          <h1>{groups[selectedGroup].groupName}</h1>

          {groups[selectedGroup].students.length === 0 && <h2>No students in this group</h2>}
          {groups[selectedGroup].students.length > 0 && (
            <>
              <Reviews
                answerSheet={answerSheet}
                updateAnswer={updateAnswer}
                showProblems={this.state.showProblems}
                openIncomplete={this.state.openIncomplete}
              />
              <Button
                margin-right="auto"
                margin-left="auto"
                variant="contained"
                color="primary"
                data-cy="submit-instructor-review-button"
                onClick={(event) => this.Submit(event, answerSheet, groups[selectedGroup])}
              >
                Submit
              </Button>
            </>
          )}
        </div>
      )
    } else {
      return (
        <div>
          <p>Loading.</p>
        </div>
      )
    }
  }
}

const ConfigurationSelectWrapper = ({ label, children }) => (
  <div style={{ padding: 20 }}>
    <Typography variant="caption">{label}</Typography>
    {children}
  </div>
)

const ConfigurationSelect = ({ selectedGroup, groups, changeGroup }) => {
  return (
    <Select
      data-cy="group-selector"
      value={selectedGroup}
      onChange={(e) => changeGroup(e.target.value)}
    >
      {groups.map((group, index) => (
        <MenuItem key={index} value={index} data-cy={`"group-list-${group.id}"`}>
          {group.groupName}
        </MenuItem>
      ))}
    </Select>
  )
}

const ReviewStatus = ({ problemCount }) =>
  problemCount === 0 ? (
    <CheckCircle color="success" titleAccess="Review complete" data-cy="review-complete" />
  ) : (
    <span
      data-cy="review-incomplete"
      style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ed6c02' }}
    >
      <ErrorOutline fontSize="small" />
      {problemCount} missing
    </span>
  )

const Review = ({ student, updateAnswer, index, showProblems, openIncomplete }) => {
  const [visible, setVisible] = useState(false)
  const problems = problemsOfStudent(student)
  const problemCount = Object.keys(problems).length

  // a failed submit opens the incomplete reviews
  useEffect(() => {
    if (openIncomplete > 0 && problemCount > 0) setVisible(true)
    // only a new submit opens the review, not the answers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIncomplete])

  return (
    <div data-cy={`instructor-review-${index}`}>
      <div
        onClick={() => setVisible(!visible)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        {student && student.name && <h2>{studentName(student)}</h2>}
        {visible ? <ExpandLess /> : <ExpandMore />}
        <ReviewStatus problemCount={problemCount} />
      </div>
      {visible && (
        <Questions
          studentAnswers={student.answers}
          updateAnswer={updateAnswer}
          userId={index}
          problems={showProblems ? problems : {}}
        />
      )}
    </div>
  )
}

const Reviews = ({ answerSheet, updateAnswer, showProblems, openIncomplete }) => {
  return answerSheet.map((student, index) => {
    return (
      <Review
        key={index}
        student={student}
        updateAnswer={updateAnswer}
        index={index}
        showProblems={showProblems}
        openIncomplete={openIncomplete}
      />
    )
  })
}

const QuestionProblem = ({ problem }) =>
  problem ? (
    <p data-cy="question-error" style={{ color: '#d32f2f', fontWeight: 'bold' }}>
      {problem}
    </p>
  ) : null

const Questions = ({ studentAnswers, updateAnswer, userId, problems }) => {
  return studentAnswers.map((question, questionId) => {
    if (question.type === 'text') {
      return (
        <div key={questionId + userId}>
          <h3>{question.header}</h3>
          <p>{question.description}</p>

          <TextField
            value={question.answer}
            rows="10"
            style={{ width: 700 }}
            multiline
            variant="outlined"
            data-cy={`textInput-${question.header} user:${userId}`}
            onChange={(e) => textFieldHandler(e.target.value, userId, questionId, updateAnswer)}
          />
          <QuestionProblem problem={problems[questionId]} />
        </div>
      )
    } else if (question.type === 'number') {
      return (
        <div key={questionId + userId}>
          <h3>{question.header}</h3>
          <p>{question.description}</p>

          <input
            type="number"
            value={question.answer}
            data-cy={`numberInput-${question.header} user:${userId}`}
            onChange={(e) => numberFieldHandler(e.target.value, userId, questionId, updateAnswer)}
          />
          <QuestionProblem problem={problems[questionId]} />
        </div>
      )
    } else if (question.type === 'info') {
      return (
        <div key={questionId + userId}>
          <h2>{question.header}</h2>
          <p>{question.description}</p>
        </div>
      )
    } else {
      return (
        <div key={questionId + userId}>
          <p>Incorrect question type</p>
        </div>
      )
    }
  })
}
const textFieldHandler = (value, userId, questionId, updateAnswer) => {
  updateAnswer(value, userId, questionId)
}
const numberFieldHandler = (value, userId, questionId, updateAnswer) => {
  updateAnswer(value, userId, questionId)
}

const mapStateToProps = (state) => {
  return {
    answerSheet: state.instructorReviewPage.answerSheet,
    submittedReview: state.instructorReviewPage.submittedReview,
    groups: state.instructorReviewPage.groups,
    selectedGroup: state.instructorReviewPage.selectedGroup,
  }
}

const mapDispatchToProps = {
  ...instructorReviewPageActions,
  ...notificationActions,
  ...appActions,
}
const ConnectedInstructorReviewPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(InstructorReviewPage)

export default withRouter(ConnectedInstructorReviewPage)
