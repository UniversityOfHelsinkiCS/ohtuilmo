import { withRouter } from '../../utils/withRouter'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'

import { withStyles } from '@mui/styles'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'
import Error from '@mui/icons-material/Error'
import { Table, TableRow, TableCell, TableHead, TableBody } from '@mui/material'
import * as notificationActions from '../../reducers/actions/notificationActions'

import './InstructorPage.css'
import StudentViewGroupAnswers from './StudentViewGroupAnswers'

//Services
import peerReviewService from '../../services/peerReview'
import instructorPageActions from '../../reducers/actions/instructorPageActions'

const StyledSelect = withStyles({
  select: {
    minWidth: '140px',
  },
})(Select)

const StyledButton = withStyles({
  root: {
    minWidth: '160px',
  },
})(Button)

const GroupStudents = ({ myGroup }) => {
  if (!myGroup || myGroup.length === 0) {
    return (
      <div className="group-notification-container">
        <Error />
        <h4>There are currently no students in your group.</h4>
      </div>
    )
  } else {
    return (
      <div className="students-container">
        <h4>Students:</h4>
        {myGroup.map((member, index) => (
          <p key={index}>
            {' '}
            {index + 1}. {member}
          </p>
        ))}
      </div>
    )
  }
}

const Answers = ({ answers, currentConfiguration, currentGroupID, viewMode }) => {
  answers = answers.filter((group) => group.group.configurationId === currentConfiguration)

  return (
    <div>
      {answers.map((projectGroup, index) => {
        if (currentGroupID === projectGroup.group.id || currentGroupID === '0') {
          return (
            <div key={index} className="flex-column-32-container divider-48">
              <br />
              <div className="group-title-container">
                <h1 className="group-name">{projectGroup.group.name}</h1>
                <h4 className="instructor-name">Instructor: {projectGroup.group.instructorName}</h4>
              </div>
              <GroupStudents myGroup={projectGroup.group.studentNames} />
              <div>
                {projectGroup.round1Answers.length > 0 ? (
                  <div className="padding-bottom-64 flex-column-16">
                    <div className="peer-review-header">
                      <h2>Peer Reviews&nbsp;</h2>
                      <h2 className="peer-review-subheader">/ 1st Round</h2>
                    </div>
                    {viewMode === 'students' ? (
                      <StudentViewGroupAnswers answers={projectGroup.round1Answers} />
                    ) : (
                      <GroupAnswers
                        answers={projectGroup.round1Answers}
                        students={projectGroup.group.studentNames}
                      />
                    )}
                  </div>
                ) : (
                  <div className="group-notification-container">
                    <Error />
                    <h4>This group has not answered to the first peer review round yet.</h4>
                  </div>
                )}

                {projectGroup.round2Answers.length > 0 ? (
                  <div className="flex-column-16">
                    <div className="peer-review-header">
                      <h2>Peer Reviews&nbsp;</h2>
                      <h2 className="peer-review-subheader">/ 2nd Round</h2>
                    </div>
                    {viewMode === 'students' ? (
                      <StudentViewGroupAnswers answers={projectGroup.round2Answers} />
                    ) : (
                      <GroupAnswers
                        answers={projectGroup.round2Answers}
                        students={projectGroup.group.studentNames}
                      />
                    )}
                  </div>
                ) : (
                  <div className="group-notification-container">
                    <Error />
                    <h4>This group has not answered to the second peer review round yet.</h4>
                  </div>
                )}
              </div>
            </div>
          )
        }
      })}
    </div>
  )
}

const getQuestions = (answers) => {
  // The same questions are found in every answer, so just grab the answers
  // from the first one
  return answers[0].answer_sheet.map((question) => {
    return {
      type: question.type,
      questionHeader: question.questionHeader,
    }
  })
}

const Question = ({ title, children }) => (
  <div className="flex-column-16">
    <div className="peer-review-question-container">
      <h3>{title}</h3>
    </div>
    {children}
  </div>
)

const GroupAnswers = ({ answers, students }) => {
  return (
    <div className="flex-column-32-container padding-left-18">
      {getQuestions(answers).map((question, index) => {
        if (question.type === 'text' || question.type === 'number') {
          return (
            <Question key={index} title={question.questionHeader}>
              <TextNumberAnswer answers={answers} questionNumber={index} />
            </Question>
          )
        } else if (question.type === 'peerReview') {
          return (
            <Question key={index} title={question.questionHeader}>
              <PeerReviewAnswer answers={answers} questionNumber={index} />
            </Question>
          )
        } else if (question.type === 'radio') {
          return (
            <Question key={index} title={question.questionHeader}>
              <RadioAnswer answers={answers} questionNumber={index} students={students} />
            </Question>
          )
        } else {
          return null
        }
      })}
    </div>
  )
}

const PeerReviewAnswer = ({ answers, questionNumber }) => {
  return (
    <div className="all-peer-reviews-container padding-left-18">
      {answers.map((member, index) => {
        const peers =
          member && member.answer_sheet && member.answer_sheet[questionNumber]
            ? member.answer_sheet[questionNumber].peers
            : null
        return (
          <div className="peer-review-and-author-container" key={`${member}-${index}`}>
            <p className="peer-review-author-text">
              Reviews by {`${member.student.first_names} ${member.student.last_name}`}:
            </p>
            <div className="peer-review-container">
              {peers &&
                Object.entries(peers).map(([peer, review]) => (
                  <div className="peer-review-text" key={peer}>
                    <p>{peer}:&nbsp;</p>
                    <p>{review}</p>
                  </div>
                ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const TextNumberAnswer = ({ answers, questionNumber }) => {
  return (
    <div className="padding-left-18">
      {answers.map((member, index) => {
        return (
          <div className="text-number-answer-container" key={index}>
            <p>
              {`${member.student.first_names} ${member.student.last_name}`}
              :&nbsp;
            </p>
            <p>{member.answer_sheet[questionNumber].answer}</p>
          </div>
        )
      })}
    </div>
  )
}

const RadioAnswer = ({ answers, questionNumber, students }) => {
  const peers = answers.map((member) => {
    return member.student.first_names + ' ' + member.student.last_name
  })
  students.forEach((s) => {
    if (!peers.includes(s)) {
      peers.push(s)
    }
  })

  return (
    <div className="padding-left-18">
      <Table size="small" className="radio-button-table">
        <TableHead>
          <TableRow hover className="radio-inforow">
            <TableCell />
            {peers.map((peer, index) => (
              <TableCell
                key={`radio-infoheader-${index}`}
                className="radio-infoheader text-overflow-ellipsis"
              >
                Reviewer
              </TableCell>
            ))}
            <TableCell />
          </TableRow>
          <TableRow hover className="radio-row">
            <TableCell />
            <PeerHeaders peers={peers} />
            <TableCell className="radio-header text-overflow-ellipsis">
              Average <p>(without self-review)</p>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {peers.map((member, index) => {
            return (
              <TableRow hover key={index}>
                <TableCell className="peer-header text-overflow-ellipsis">
                  <p>{member}</p>
                </TableCell>
                <PeerRows
                  member={member}
                  answers={answers}
                  questionNumber={questionNumber}
                  numberOfPeers={peers.length}
                />
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

const PeerHeaders = ({ peers }) => {
  return peers.map((option, optionId) => {
    return (
      <TableCell className="radio-header text-overflow-ellipsis" key={optionId}>
        {option}
      </TableCell>
    )
  })
}

const sum = (arr) => arr.reduce((sum, value) => sum + value, 0)

const PeerRows = ({ member, answers, questionNumber, numberOfPeers }) => {
  const allPeersRatings = new Array(numberOfPeers).fill({
    rating: '-',
    isSelf: false,
  })

  answers.forEach((answer, index) => {
    const peerFullName = `${answer.student.first_names} ${answer.student.last_name}`
    if (answer.answer_sheet[questionNumber].peers[member] !== undefined) {
      allPeersRatings[index] = {
        rating: answer.answer_sheet[questionNumber].peers[member],
        isSelf: peerFullName === member,
      }
    }
  })

  const validRatings = allPeersRatings
    .filter((ratingInfo) => ratingInfo.rating !== '-' && !ratingInfo.isSelf)
    .map((ratingInfo) => ratingInfo.rating)

  const averageRating =
    validRatings.length > 0 ? (sum(validRatings) / validRatings.length).toFixed(2) : 'N/A'

  return (
    <React.Fragment>
      {allPeersRatings.map((ratingInfo, index) => (
        <TableCell className="radio-button" key={`peer-row-${index}`}>
          {typeof ratingInfo.rating === 'number' ? ratingInfo.rating.toFixed(2) : ratingInfo.rating}
        </TableCell>
      ))}
      <TableCell className="radio-button">{averageRating}</TableCell>
    </React.Fragment>
  )
}

const DownloadButton = ({ jsonData, fileName }) => {
  const data = `text/json;charset=utf-8,${encodeURIComponent(jsonData)}`
  const href = `data:${data}`

  return (
    <StyledButton component="a" href={href} download={fileName} variant="contained" color="primary">
      Download JSON
    </StyledButton>
  )
}

const SelectViewButton = ({ viewMode, setViewMode }) => {
  const toggleView = () => {
    setViewMode(viewMode === 'questions' ? 'students' : 'questions')
  }

  return (
    <StyledButton onClick={toggleView} variant="contained" color="primary">
      {viewMode === 'questions' ? 'Student' : 'Question'} View
    </StyledButton>
  )
}

const ConfigurationSelectWrapper = ({ label, children }) => (
  <div>
    <Typography variant="caption">{label}</Typography>
    {children}
  </div>
)

const ConfigurationSelect = ({
  currentConfiguration,
  setCurrentConfiguration,
  configurations,
  setCurrentGroupID,
}) => {
  return (
    <StyledSelect
      MenuProps={{
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left',
        },
      }}
      data-cy="configuration-selector"
      value={currentConfiguration}
      onChange={(e) => {
        setCurrentConfiguration(e.target.value)
        setCurrentGroupID('0')
      }}
    >
      {configurations.map((configuration) => (
        <MenuItem
          key={configuration.id}
          className="configuration-menu-item"
          value={configuration.id}
        >
          {configuration.name}
        </MenuItem>
      ))}
    </StyledSelect>
  )
}

const GroupSelectWrapper = ({ label, children }) => (
  <div>
    <Typography variant="caption">{label}</Typography>
    {children}
  </div>
)

const GroupSelect = ({ currentGroupID, setCurrentGroupID, allGroupsInConfig }) => {
  return (
    <StyledSelect
      MenuProps={{
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left',
        },
      }}
      data-cy="group-selector"
      value={currentGroupID}
      onChange={(e) => setCurrentGroupID(e.target.value)}
    >
      <MenuItem key={0} className="all-groups-menu-item" value={'0'}>
        All groups
      </MenuItem>
      {allGroupsInConfig.map((group) => (
        <MenuItem key={group.id} className="specified-group-menu-item" value={group.id}>
          {group.name}
        </MenuItem>
      ))}
    </StyledSelect>
  )
}

const getUniqueConfigurations = (groups) => {
  const uniqueLookup = groups.reduce((configurations, group) => {
    return {
      ...configurations,
      [group.configurationId]: {
        name: group.configurationName,
        id: group.configurationId,
      },
    }
  }, {})

  return Object.values(uniqueLookup)
}

const InstructorPage = (props) => {
  const {
    answers,
    currentConfiguration,
    configurations,
    currentGroupID,
    groups,
    setAnswers,
    setConfigurations,
    setCurrentConfiguration,
    setGroups,
    setCurrentGroupID,
    setError,
  } = props

  const [viewMode, setViewMode] = useState('questions')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const peerReviewData = await peerReviewService.getAnswersByInstructor()
        const groupsData = peerReviewData.map((data) => data.group)
        const uniqueConfigurations = getUniqueConfigurations(groupsData)

        setAnswers(peerReviewData)
        setConfigurations(uniqueConfigurations.reverse())
        setCurrentConfiguration(uniqueConfigurations[0].id)
        setGroups(groupsData)
        setCurrentGroupID('0')
      } catch (err) {
        console.error('error happened', err, err.response)
        setError('Something is wrong... try reloading the page')
      }
    }

    fetchData()
  }, [
    setAnswers,
    setConfigurations,
    setCurrentConfiguration,
    setError,
    setGroups,
    setCurrentGroupID,
  ])

  if (!answers || !currentConfiguration || !groups || !currentGroupID) {
    return <div className="flex-column-32-container">Loading</div>
  }

  return (
    <div className="flex-column-32-container">
      <div className="filter-row-container">
        <div className="selector-container">
          <ConfigurationSelectWrapper label="Configuration">
            <ConfigurationSelect
              currentConfiguration={currentConfiguration}
              setCurrentConfiguration={setCurrentConfiguration}
              configurations={configurations}
              setCurrentGroupID={setCurrentGroupID}
            />
          </ConfigurationSelectWrapper>
          <GroupSelectWrapper label="Group">
            <GroupSelect
              currentGroupID={currentGroupID}
              setCurrentGroupID={setCurrentGroupID}
              allGroupsInConfig={groups.filter(
                (group) => group.configurationId === currentConfiguration,
              )}
            />
          </GroupSelectWrapper>
        </div>
        <div className="button-container">
          <DownloadButton jsonData={JSON.stringify(answers)} fileName="peerReviews.json" />
          <SelectViewButton viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>
      <Answers
        answers={answers}
        currentConfiguration={currentConfiguration}
        currentGroupID={currentGroupID}
        viewMode={viewMode}
      />
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    configurations: state.instructorPage.configurations,
    currentConfiguration: state.instructorPage.currentConfiguration,
    answers: state.instructorPage.answers,
    groups: state.instructorPage.groups,
    currentGroupID: state.instructorPage.currentGroupID,
  }
}

const mapDispatchToProps = {
  setConfigurations: instructorPageActions.setConfigurations,
  setCurrentConfiguration: instructorPageActions.setCurrentConfiguration,
  setAnswers: instructorPageActions.setAnswers,
  setError: notificationActions.setError,
  setGroups: instructorPageActions.setGroups,
  setCurrentGroupID: instructorPageActions.setCurrentGroupID,
}

const ConnectedInstructorPage = connect(mapStateToProps, mapDispatchToProps)(InstructorPage)

export default withRouter(ConnectedInstructorPage)
