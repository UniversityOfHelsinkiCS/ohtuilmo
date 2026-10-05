import { withRouter } from '../utils/withRouter'
import React from 'react'
import { connect } from 'react-redux'

import './PeerReviewPage.css'
import { getUser, extractCallingName } from '../utils/functions'
import { NotInGroupPlaceholder, LoadingPlaceholder } from './common/Placeholders'

// Actions
import appActions from '../reducers/actions/appActions'
import * as notificationActions from '../reducers/actions/notificationActions'
import peerReviewPageActions from '../reducers/actions/peerReviewPageActions.js'
// Services
import peerReviewService from '../services/peerReview'
import groupManagementService from '../services/groupManagement'
import timeLogService from '../services/timeLogs'

import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { Table, TableHead, TableRow, TableBody, TableCell } from '@mui/material'

class PeerReview extends React.Component {
  async componentDidMount() {
    // If we already have the questions and answers loaded in Redux we can skip fetching
    if (this.props.answerSheet && this.props.answerSheet.length > 0 && !this.props.isInitializing) {
      return
    }

    this.props.setLoading(true)

    try {
      const group = await groupManagementService.getByStudent()
      if (group) {
        // NOTE: Because in App.jsx fetchRegistrationManagement takes so long
        // this runs once before reviewConf is set by the above
        // function, we get one call to /api/configurations/0/...
        // which obviously fails. This happens only when navigating
        // straight to this page and fixes itself right after.
        const reviewQuestionsSet = await peerReviewService.getReviewQuestions(
          this.props.reviewConf,
          this.props.reviewRound,
        )

        const questionObject = { questions: reviewQuestionsSet.questions }

        this.props.setQuestions(questionObject)

        this.fetchPeerReviewQuestions(group.students, reviewQuestionsSet)
        this.props.createPeers(group.students)
        const submittedReviews = await peerReviewService.get()
        this.props.setSubmittedReviews(submittedReviews)
      } else {
        this.props.setLoading(false)
      }
    } catch (e) {
      console.log('error happened', e.response)
      this.props.setError('Something is wrong... try reloading the page')
    }
  }

  async fetchPeerReviewQuestions(peers, questionObject) {
    const projectHours = await timeLogService.getProjectHoursByStudent()

    const initializeProjectHours = (question, questionId) => {
      return {
        type: 'number',
        questionHeader: question.header,
        id: questionId,
        answer: Math.round(projectHours),
      }
    }

    const initializeRadioAnswer = (question, questionId) => {
      let peerAnswers = {
        type: 'radio',
        id: questionId,
        questionHeader: question.header,
        peers: {},
      }

      peers.forEach((peer) => (peerAnswers.peers[peer.first_names + ' ' + peer.last_name] = null))

      return peerAnswers
    }

    const initializeRadioOneliner = (question, questionId) => {
      return {
        type: 'radioOneliner',
        id: questionId,
        questionHeader: question.header,
        options: question.options,
        optional: question.optional ?? false,
        answer: null,
      }
    }

    const initializeNumberAnswer = (question, questionId) => {
      return {
        type: 'number',
        questionHeader: question.header,
        id: questionId,
        answer: 0,
      }
    }

    const initializeTextAnswer = (question, questionId) => {
      return {
        type: 'text',
        questionHeader: question.header,
        id: questionId,
        optional: question.optional ?? false,
        answer: '',
      }
    }

    const initializePeerReview = (question, questionId) => {
      let peerTextAnswers = {
        type: 'peerReview',
        questionHeader: question.header,
        id: questionId,
        peers: {},
      }

      peers.forEach(
        (peer) => (peerTextAnswers.peers[peer.first_names + ' ' + peer.last_name] = null),
      )

      return peerTextAnswers
    }

    const tempAnswerSheet = questionObject.questions.map((question, questionID) => {
      if (question.header === 'Kuinka monta tuntia käytit ohjelmistotuotantoprojektiin yhteensä?') {
        return initializeProjectHours(question, questionID)
      } else if (question.type === 'radio') {
        return initializeRadioAnswer(question, questionID)
      } else if (question.type === 'radioOneliner') {
        return initializeRadioOneliner(question, questionID)
      } else if (question.type === 'peerReview') {
        return initializePeerReview(question, questionID)
      } else if (question.type === 'text') {
        return initializeTextAnswer(question, questionID)
      } else if (question.type === 'number') {
        return initializeNumberAnswer(question, questionID)
      } else {
        return question
      }
    })

    this.props.initializeAnswerSheet(tempAnswerSheet)
  }

  Submit = async (event, answerSheet, reviewConf) => {
    event.preventDefault()

    const answer = window.confirm('Answers can not be changed after submitting. Continue?')
    if (!answer) return
    try {
      const createdReview = await peerReviewService.create({
        peerReview: {
          answer_sheet: answerSheet,
          user_id: getUser().student_number,
          configuration_id: reviewConf,
          review_round: this.props.reviewRound,
        },
      })
      this.props.setSubmittedReviews(this.props.submittedReviews.concat(createdReview))
      this.props.setSuccess('Peer review saved!')
      this.props.history.push('/')
    } catch (e) {
      console.log('error happened', e.response)
      this.props.setError(e.response.data.error)
    }
  }

  render() {
    const {
      answerSheet,
      updateAnswer,
      updatePeerReview,
      peers,
      groupsLoading,
      submittedReviews,
      isInitializing,
      questionObject,
      reviewConf,
      reviewOpen,
      reviewRound,
    } = this.props

    if (isInitializing) {
      return <LoadingPlaceholder />
    } else if (!reviewOpen) {
      return (
        <div className="peer-review-container">
          <h1 className="peer-review-container__h1">Peer review is not currently open!</h1>
        </div>
      )
    } else if (groupsLoading) {
      return <NotInGroupPlaceholder />
    } else if (submittedReviews.length >= reviewRound) {
      return (
        <div className="peer-review-container">
          <h1 className="peer-review-container__h1">Peer review already submitted!</h1>
        </div>
      )
    } else {
      return (
        <div className="peer-review-container">
          <h1 className="peer-review-container__h1">Peer Review</h1>
          <Questions
            peers={peers}
            questions={questionObject.questions}
            answerSheet={answerSheet}
            updateAnswer={updateAnswer}
            updatePeerReview={updatePeerReview}
          />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              margin-right="auto"
              margin-left="auto"
              variant="contained"
              color="primary"
              onClick={(event) => this.Submit(event, answerSheet, reviewConf)}
            >
              Submit
            </Button>
          </div>
        </div>
      )
    }
  }
}

const Questions = ({ questions, peers, answerSheet, updateAnswer, updatePeerReview }) => {
  return (
    <div>
      {questions.map((question, questionId) => {
        return (
          <Question
            key={questionId}
            question={question}
            peers={peers}
            questionId={questionId}
            answerSheet={answerSheet}
            updateAnswer={updateAnswer}
            updatePeerReview={updatePeerReview}
          />
        )
      })}
    </div>
  )
}

const Question = ({ peers, question, questionId, answerSheet, updateAnswer, updatePeerReview }) => {
  if (questionId === undefined) {
    console.error('No questionId given')
    return (
      <div>
        <p>No questionId for this question!</p>
      </div>
    )
  }
  if (question.type === 'radio') {
    let temp = question.options

    if (question.options === undefined) {
      temp = [0, 1, 2, 3, 4, 5]
    }
    return (
      <div className="peer-review-box">
        <h3 className="peer-review-box__h3">{question.header}</h3>
        <Table size="small" className="peer-review-box__radio-button-table">
          <TableHead>
            <TableRow hover>
              <TableCell className="peer-review-box__radio-header" />
              <OptionHeaders options={temp} />
            </TableRow>
          </TableHead>
          <TableBody>
            <QuestionRows
              peers={peers}
              options={temp}
              questionId={question.header}
              answerSheet={answerSheet[questionId]}
            />
          </TableBody>
        </Table>
      </div>
    )
  } else if (question.type === 'radioOneliner') {
    let temp = question.options

    if (question.options === undefined) {
      temp = ['Kyllä', 'Ei']
    }
    return (
      <div className="peer-review-box">
        <h3 className="peer-review-box__h3">{question.header}</h3>
        <Table size="small" className="peer-review-box__radio-button-table">
          <TableHead>
            <TableRow hover>
              <OptionHeaders options={temp} />
            </TableRow>
          </TableHead>
          <TableBody>
            <QuestionRowOneLine
              options={temp}
              questionId={question.header}
              answerSheet={answerSheet[questionId]}
            />
          </TableBody>
        </Table>
      </div>
    )
  } else if (question.type === 'peerReview') {
    return (
      <div className="peer-review-box">
        <h3 className="peer-review-box__h3">{question.header}</h3>
        <p>{question.description}</p>

        <PeerReviewTextFields
          peers={peers}
          questionId={questionId}
          answerSheet={answerSheet}
          updatePeerReview={updatePeerReview}
        />
      </div>
    )
  } else if (question.type === 'text') {
    return (
      <div className="peer-review-box">
        <div className="peer-review-box__text-question-container">
          <div>
            <h3 className="peer-review-box__h3">{question.header}</h3>
            <p>{question.description}</p>

            <TextField
              value={answerSheet[questionId].answer}
              rows="4"
              style={{ width: '75%' }}
              multiline
              variant="outlined"
              onChange={(e) => textFieldHandler(e.target.value, questionId, updateAnswer)}
            />
          </div>
        </div>
      </div>
    )
  } else if (question.type === 'number') {
    return (
      <div className="peer-review-box">
        <h3>{question.header}</h3>
        <p>{question.description}</p>

        <input
          type="number"
          data-cy={`input_number_${question.header}`}
          value={answerSheet[questionId].answer}
          onChange={(e) => textFieldHandler(e.target.value, questionId, updateAnswer)}
        />
      </div>
    )
  } else if (question.type === 'info') {
    return (
      <div className="peer-review-box">
        <h3>{question.header}</h3>
        <p className="peer-review__description">{question.description}</p>
      </div>
    )
  } else {
    return (
      <div>
        <p>Incorrect question type</p>
      </div>
    )
  }
}

const OptionHeaders = ({ options }) => {
  return options.map((option, optionId) => {
    return (
      <TableCell className="peer-review-box__radio-header" key={optionId}>
        {option}
      </TableCell>
    )
  })
}

const QuestionRows = ({ peers, options, questionId, answerSheet }) => (
  <React.Fragment>
    {peers.map((peer, mappiAvain) => (
      <QuestionRow
        key={mappiAvain}
        options={options}
        peerName={extractCallingName(peer.first_names) + ' ' + peer.last_name}
        peerId={peer.first_names + ' ' + peer.last_name}
        questionId={questionId}
        answerSheet={answerSheet}
      />
    ))}
  </React.Fragment>
)

const PeerReviewTextFields = ({ peers, questionId, answerSheet, updatePeerReview }) => {
  return (
    <div className="peer-review-box__text-field-rows">
      {peers.map((peer, key) => (
        <div key={key} className="peer-review-box__text-field-container">
          <p className="peer-review-box__name-text">
            {extractCallingName(peer.first_names) + ' ' + peer.last_name}:{' '}
          </p>
          <TextField
            className="peer-review-box__text-field"
            value={answerSheet[questionId].answer}
            rows="2"
            multiline
            variant="outlined"
            onChange={(e) =>
              peerReviewHandler(
                `${peer.first_names} ${peer.last_name}`,
                e.target.value,
                questionId,
                updatePeerReview,
              )
            }
          />
        </div>
      ))}
    </div>
  )
}

const QuestionRow = ({ peerName, options, peerId, questionId, answerSheet }) => {
  return (
    <TableRow hover className="peer-review-box__peer-row">
      <TableCell align="center">{peerName}</TableCell>
      {options.map((buttonId, buttonNumber) => {
        return (
          <TableCell className="peer-review-box__radio-button" key={buttonId}>
            <input
              type="radio"
              name={questionId.toString() + peerId.toString()}
              onClick={() => radioSelectHandler(peerId, buttonNumber, answerSheet)}
            />
          </TableCell>
        )
      })}
    </TableRow>
  )
}

const QuestionRowOneLine = ({ options, questionId, answerSheet }) => {
  return (
    <TableRow hover className="peer-review-box__peer-row">
      {options.map((buttonId, buttonNumber) => {
        return (
          <TableCell className="peer-review-box__radio-button" key={buttonId}>
            <input
              type="radio"
              name={questionId.toString()}
              onClick={() => radioSelectHandlerOneLine(buttonNumber, answerSheet)}
            />
          </TableCell>
        )
      })}
    </TableRow>
  )
}

const peerReviewHandler = (peerId, value, questionId, updatePeerReview) => {
  updatePeerReview(peerId, value, questionId)
}

const textFieldHandler = (value, questionId, updateAnswer) => {
  updateAnswer(value, questionId)
}

const radioSelectHandler = (peerId, buttonId, answerSheet) => {
  updateAnswers(peerId, buttonId, answerSheet)
}

const radioSelectHandlerOneLine = (buttonId, questionId) => {
  updateOneliner(buttonId, questionId)
}

const updateOneliner = (buttonId, answerSheet) => {
  answerSheet.answer = buttonId
}
const updateAnswers = (peerId, buttonId, answerSheet) => {
  answerSheet.peers[peerId] = buttonId
}

const mapStateToProps = (state) => {
  return {
    answerSheet: state.peerReviewPage.answerSheet,
    isInitializing: state.peerReviewPage.isInitializing,
    peers: state.peerReviewPage.peers,
    groupsLoading: state.peerReviewPage.groupsLoading,
    submittedReviews: state.peerReviewPage.submittedReviews,
    questionObject: state.peerReviewPage.questions,
    reviewConf: state.registrationManagement.peerReviewConf,
    reviewRound: state.registrationManagement.peerReviewRound,
    reviewOpen: state.registrationManagement.peerReviewOpen,
  }
}

const mapDispatchToProps = {
  ...peerReviewPageActions,
  ...notificationActions,
  ...appActions,
}

const ConnectedPeerReview = connect(mapStateToProps, mapDispatchToProps)(PeerReview)
export default withRouter(ConnectedPeerReview)
