import { withRouter } from '../utils/withRouter'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { connect, useDispatch } from 'react-redux'

import registrationActions from '../reducers/actions/registrationActions'
import { setError } from '../reducers/actions/notificationActions'
import { updateConsent } from '../reducers/actions/userActions'
import peerReviewService from '../services/peerReview'

import Typography from '@mui/material/Typography'
import {
  Input,
  Card,
  CardContent,
  Select,
  MenuItem,
  RadioGroup,
  Radio,
  FormControl,
  FormControlLabel,
  Button,
} from '@mui/material'
import CourseMaterial from './common/CourseMaterial'
import SortableTopicList from './SortableTopicList'

import { formatDate, extractCallingName } from '../utils/functions'

import './RegistrationDetailsPage.css'

class PeerReviewInfo extends React.Component {
  constructor(props) {
    super(props)
    this.state = { submittedReviews: [] }
  }

  async componentDidMount() {
    const data = await peerReviewService.get()
    if (data) {
      this.setState({
        submittedReviews: data,
      })
    }
  }

  render() {
    const { submittedReviews } = this.state
    const { peerReviewOpen, peerReviewRound, groupDetails } = this.props

    return (
      <div>
        {(peerReviewOpen || submittedReviews.length > 0) && groupDetails ? (
          <div>
            <Typography variant="h2">Peer reviews</Typography>
            {submittedReviews.length > 0 && (
              <div>
                {submittedReviews.map((review, index) => {
                  return (
                    <Typography variant="body1" gutterBottom key={index}>
                      Peer review {review.review_round} submission date:{' '}
                      {formatDate(review.createdAt)}
                    </Typography>
                  )
                })}
              </div>
            )}
            {peerReviewOpen && peerReviewRound > submittedReviews.length && (
              <div>
                <Link to="/peerreview" data-cy="peerreviewlink">
                  Click here to submit peer review {peerReviewRound}
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </div>
    )
  }
}

const ResearchConsent = ({ student }) => {
  const [consent, setConsent] = useState(student.research_consent)
  const dispatch = useDispatch()
  const handleUpdate = () => {
    dispatch(updateConsent(consent, student))
  }
  return (
    <div>
      <Typography variant="h2">Tutkimuslupa</Typography>
      <Typography style={{ width: '60%' }}>
        Teemme Helsingin yliopistossa tutkimusta generatiivisen tekoälyn käytöstä opintojen aikana.
        Tällä kurssilla vertaisarvioinneissa ja tuntikirjanpidossa (timelogs) tullaan esittämään
        kysymyksiä generatiivisen tekoälyn käytöstä osana ohjelmistoprojektia. Näihin kysymyksiin
        annettuja vastauksia voidaan hyödyntää kurssin kehityksen lisäksi tutkimuksessa. Osana
        aineiston analyysiä vastauksesi kysymyksiin voidaan yhdistää arvosana- ja
        kurssisuoritustietoihisi, mutta sinua tai ryhmääsi ei voida tunnistaa julkaistusta
        tutkimuksesta. Lisätietoja voi kysyä Matti Luukkaiselta (vastuuopettaja) tai Outi
        Savolaiselta (opettaja).
      </Typography>
      <br />
      <Typography style={{ width: '60%', fontWeight: 'bold' }}>
        Tutkimukseen osallistuminen tai siitä kieltäytyminen ei vaikuta kohteluusi kurssilla.
      </Typography>
      <FormControl>
        <RadioGroup
          name="research-consent-group"
          value={consent ? 'consentGiven' : 'denied'}
          onChange={() => setConsent(!consent)}
        >
          <FormControlLabel
            value={'consentGiven'}
            control={<Radio />}
            label="Kyllä, vastauksiani saa hyödyntää myös tutkimuksessa."
          />
          <FormControlLabel
            value={'denied'}
            control={<Radio />}
            label="Ei, vastauksiani saa käyttää vain kurssin kehitykseen"
          />
        </RadioGroup>
        <Button
          style={{ marginRight: '10px', height: '40px', width: 250 }}
          color="inherit"
          variant="outlined"
          onClick={handleUpdate}
        >
          Tallenna valintasi
        </Button>
      </FormControl>
    </div>
  )
}

const GroupDetails = ({ groupDetails }) => {
  return (
    <div>
      <h2>Group</h2>
      {groupDetails ? (
        <div>
          <h4>Name</h4>
          <Typography variant="body1" gutterBottom>
            {groupDetails.groupName}
          </Typography>
          <h4>Project length</h4>
          <Typography variant="body1" gutterBottom>
            {groupDetails.isShortProject ? 'Short' : 'Normal'}
          </Typography>
          <h4>Instructor</h4>
          <Typography variant="body1" gutterBottom>
            {groupDetails.instructor}
          </Typography>
          <h4>Members</h4>
          {groupDetails.students.map((member, index) => {
            return (
              <Typography variant="body1" key={index}>
                {extractCallingName(member.first_names)} {member.last_name}
              </Typography>
            )
          })}
        </div>
      ) : (
        <Typography variant="body1" gutterBottom>
          not assigned yet
        </Typography>
      )}
    </div>
  )
}

const UserDetails = ({ student }) => {
  const { first_names, last_name, student_number, email } = student

  return (
    <div>
      <h2>User details</h2>
      <Typography variant="body1" gutterBottom>
        Name: {extractCallingName(first_names)} {last_name}
        <br />
        Student number: {student_number}
        <br />
        Email: {email}
      </Typography>
    </div>
  )
}

const PreferredTopics = ({ topics }) => {
  return (
    <div>
      <h2>Preferred Topics</h2>
      <div className="dragndrop-container" style={{ flexDirection: 'column' }}>
        <SortableTopicList topics={topics} isReadOnly={true} />
      </div>
    </div>
  )
}

const RegistrationAnswers = ({ questions }) => {
  return (
    <div>
      <h2>Answers</h2>
      {questions.map((question, index) => {
        return (
          <Card style={{ marginBottom: '10px' }} key={index}>
            <CardContent>
              <Typography variant="body1">{question.question}</Typography>
              {question.type === 'scale' ? (
                <Select value={question.answer} disabled>
                  <MenuItem value={0}>0</MenuItem>
                  <MenuItem value={1}>1</MenuItem>
                  <MenuItem value={2}>2</MenuItem>
                  <MenuItem value={3}>3</MenuItem>
                  <MenuItem value={4}>4</MenuItem>
                  <MenuItem value={5}>5</MenuItem>
                </Select>
              ) : (
                <Input value={question.answer} fullWidth multiline maxRows="3" disabled />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

class RegistrationDetailsPage extends React.Component {
  async componentDidMount() {
    if (this.props.ownRegistrations.length === 0) {
      await this.fetchOwnregistrations()
    }
  }

  fetchOwnregistrations = async () => {
    try {
      await this.props.fetchRegistrations()
    } catch (e) {
      console.log('error happened', e.response)
      this.props.setError('Error fetching own registration... try reloading the page', 3000)
    }
  }

  render() {
    /**
     * Show primarily peer review registration, secondarily project registration
     */
    const {
      groupDetails,
      ownRegistrations,
      peerReviewConf,
      projectRegistrationConf,
      peerReviewOpen,
      peerReviewRound,
      user,
    } = this.props

    if (groupDetails) {
      return (
        <div className="registration-details-container">
          <GroupDetails groupDetails={groupDetails} />
          <PeerReviewInfo
            peerReviewOpen={peerReviewOpen}
            peerReviewRound={peerReviewRound}
            groupDetails={groupDetails}
          />
          <ResearchConsent student={user} />
        </div>
      )
    }

    if (ownRegistrations.length === 0) {
      return <h2>loading...</h2>
    }

    const projectReg = ownRegistrations.find(
      (registration) => registration.configuration_id === projectRegistrationConf,
    )

    const reviewConf = ownRegistrations.find(
      (registration) => registration.configuration_id === peerReviewConf,
    )

    const registration = reviewConf ? reviewConf : projectReg

    const { student, preferred_topics, questions, createdAt } = registration

    return (
      <div className="registration-details-container">
        <Typography variant="h4" gutterBottom>
          Registration details
        </Typography>
        <Typography variant="body1" gutterBottom>
          Registration date: {formatDate(createdAt)}
        </Typography>
        <CourseMaterial />
        <PeerReviewInfo
          peerReviewOpen={peerReviewOpen}
          peerReviewRound={peerReviewRound}
          groupDetails={groupDetails}
        />
        <GroupDetails groupDetails={groupDetails} />
        <UserDetails student={student} />
        <PreferredTopics topics={preferred_topics} />
        <RegistrationAnswers questions={questions} />
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    ownRegistrations: state.registrations,
    peerReviewOpen: state.registrationManagement.peerReviewOpen,
    groupDetails: state.registrationDetails.myGroup,
    peerReviewRound: state.registrationManagement.peerReviewRound,
    peerReviewConf: state.registrationManagement.peerReviewConf,
    projectRegistrationConf: state.registrationManagement.projectRegistrationConf,
    user: state.login.user.user,
  }
}

const mapDispatchToProps = {
  fetchRegistrations: registrationActions.fetchRegistrations,
  setError,
}

const ConnectedRegistrationDetailsPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(RegistrationDetailsPage)

export default withRouter(ConnectedRegistrationDetailsPage)
