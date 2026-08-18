import { withRouter } from '../utils/withRouter'
import React from 'react'

import { connect } from 'react-redux'
// MUI
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Input from '@mui/material/Input'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
// services
import topicService from '../services/topic'
import userService from '../services/user'
import registrationService from '../services/registration'
import configurationService from '../services/configuration'
// components
import LoadingSpinner from './common/LoadingSpinner'
import CourseMaterial from './common/CourseMaterial'
import UserDetails from './UserDetails'
import './RegistrationPage.css'
// Actions
import registrationPageActions from '../reducers/actions/registrationPageActions'
import * as notificationActions from '../reducers/actions/notificationActions'
import registrationActions from '../reducers/actions/registrationActions'
import registrationmanagementActions from '../reducers/actions/registrationManagementActions'
import SortableTopicList from './SortableTopicList'

const Prerequisites = ({ checkbox1, checkbox2, checkbox3, onToggle1, onToggle2, onToggle3 }) => {
  return (
    <div
      style={{
        fontWeight: 'bold',
        marginBottom: 30,
        border: 'solid',
        padding: 20,
        borderRadius: 10,
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        Projektin{' '}
        <a href="https://github.com/HY-TKTL/TKT20007-Ohjelmistotuotantoprojekti/blob/master/README.md#arvosteluperusteet">
          arvosteluperusteissa
        </a>{' '}
        erääksi kriteeriksi mainitaan työmäärä ja tasainen työskentely. Vaatimuksena on noin 200
        tuntia työtä koko kurssin aikana, mikä on noin 15 tuntia viikossa.
      </div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: '10px',
        }}
      >
        <input
          type="checkbox"
          checked={checkbox1}
          onChange={onToggle1}
          style={{ marginRight: '8px' }}
        />
        olen tutustunut projektin arvosteluperusteisiin
      </label>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: '10px',
        }}
      >
        <input
          type="checkbox"
          checked={checkbox2}
          onChange={onToggle2}
          style={{ marginRight: '8px' }}
        />
        sitoudun työskentelemään koko projektin ajan tasaisesti
      </label>
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checkbox3}
          onChange={onToggle3}
          style={{ marginRight: '8px' }}
        />
        Vakuutan että esitiedot on suoritettu projektin alkuun mennessä
      </label>
    </div>
  )
}

class RegistrationPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      checkbox1: false,
      checkbox2: false,
      prerequisitesReady: false,
      prerequisitesConfirmed: false,
    }
  }

  async componentDidMount() {
    /**
     * If user goes straight to /register, registrationmanagement needs to be fetched first.
     */
    if (!this.props.registrationManagementFetched) {
      await this.fetchRegistrationManagement()
    }
    this.fetchOwnregistrations()
    this.fetchTopics()
    this.fetchQuestions()
    this.props.updateEmail(this.props.user.user.email)
  }

  async fetchRegistrationManagement() {
    try {
      await this.props.fetchRegistrationManagement()
    } catch (e) {
      console.log('error happened', e)
      this.props.setError('Error fetching registration management configuration', 5000)
    }
  }

  async fetchOwnregistrations() {
    try {
      await this.props.fetchRegistrations()
    } catch (e) {
      console.log('error happened', e.response)
      this.props.setError('Error fetching own registration... try reloading the page', 3000)
    }
  }

  async fetchQuestions() {
    try {
      const { projectConf } = this.props
      const response = await configurationService.getById(projectConf)
      let questions = response.registration_question_set.questions
      questions = questions ? questions : []
      this.props.updateQuestions(questions)
    } catch (e) {
      console.log('error happened', e.response)
      this.props.setError('Error fetching questions', 3000)
    }
  }

  async fetchTopics() {
    try {
      const fetchedTopics = await topicService.getAllActive().then(function (defs) {
        return defs
      })

      this.props.updateTopics(fetchedTopics)
    } catch (e) {
      console.log('error happened', e.response)
      this.props.setError('Error fetching topics', 3000)
    }
  }

  handleUpdate = (evt, updated) => {
    this.props.updateTopics(updated)
  }

  updateUser = async () => {
    const user = {
      student_number: this.props.user.user.student_number,
      email: { email: this.props.email },
    }
    try {
      const response = await userService.update(user)
      var loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'))
      loggedInUser['user'] = response.user
      localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser))
    } catch (e) {
      console.log('error happened', e.response)
      this.props.setError('Error updating user', 3000)
    }
  }

  toggleCheckbox1 = () => {
    this.setState({ checkbox1: !this.state.checkbox1 })
  }

  toggleCheckbox2 = () => {
    this.setState({ checkbox2: !this.state.checkbox2 })
  }

  togglePrerequisitesReady = () => {
    if (!this.state.prerequisitesReady) {
      const answer = window.confirm(
        'Vakuutatko että kaikki esitiedot (Ohjelmistotuotanto, Tietokannat ja Web-ohjelmointi sekä yksi aineopintojen harjoitustyö tai Full stack -websovelluskehitys) on suoritettu tai palautettu arvosteltavaksi projektin alkuun mennessä?\n\nDo you confirm that all prerequisite courses have been completed or submitted for grading by the start of the project?',
      )
      if (answer) {
        this.setState({ prerequisitesReady: true })
      }
    } else {
      this.setState({ prerequisitesReady: false })
    }
  }

  togglePrerequisitesConfirmed = () => {
    if (!this.state.prerequisitesConfirmed) {
      const answer = window.confirm(
        'Vakuutatko että kaikki esitiedot (Ohjelmistotuotanto, Tietokannat ja Web-ohjelmointi sekä yksi aineopintojen harjoitustyö tai Full stack -websovelluskehitys) on suoritettu tai palautettu arvosteltavaksi projektin alkuun mennessä?\n\nDo you confirm that all prerequisite courses have been completed or submitted for grading by the start of the project?',
      )
      if (answer) {
        this.setState({ prerequisitesConfirmed: true })
      }
    } else {
      this.setState({ prerequisitesConfirmed: false })
    }
  }

  submitRegistration = async (e) => {
    e.preventDefault()

    if (!this.state.checkbox1 || !this.state.checkbox2 || !this.state.prerequisitesConfirmed) {
      this.props.setError('Please check all boxes to enable submission', 3000)
      return
    }

    const answer = window.confirm(
      'Vakuutatko että kaikki esitiedot (Ohjelmistotuotanto, Tietokannat ja Web-ohjelmointi sekä yksi aineopintojen harjoitustyö tai Full stack -websovelluskehitys) on suoritettu tai palautettu arvosteltavaksi projektin alkuun mennessä?\n\nDo you confirm that all prerequisite courses have been completed or submitted for grading by the start of the project?',
    )
    if (!answer) return

    try {
      await this.updateUser()
      await registrationService.create({
        questions: this.props.questions,
        preferred_topics: this.props.topics,
      })
      this.props.setSuccess('Registration submitted', 15000)
      this.props.history.push('/')
    } catch (e) {
      console.log(e)
      if (e.response.data.error === 'student already registered') {
        this.props.setError('You have already registered for this course', 15000)
      } else if (e.response.data.error === 'missing email') {
        this.props.setError('Email is missing', 5000)
      } else {
        this.props.setError('Error happened', 5000)
      }
    }
  }

  render() {
    const { ownRegistrations, projectOpen, user, projectConf } = this.props

    if (
      ownRegistrations.length > 0 &&
      ownRegistrations.find((registration) => registration.configuration_id === projectConf)
    ) {
      return <h2>You have already registered to current project.</h2>
    }

    if (!projectOpen) {
      return <h2>Registration is not currently open.</h2>
    }

    if (!user) {
      return <LoadingSpinner />
    }

    const questions = this.props.questions.map((item, idx) => (
      <Card style={{ marginBottom: '10px' }} key={idx}>
        <CardContent>
          <p>{item.question}</p>
          {item.type === 'scale' ? (
            <div>
              <Select
                value={
                  this.props.questions[idx].answer === undefined
                    ? -1
                    : this.props.questions[idx].answer
                }
                onChange={(event) => this.props.updateQuestionAnswer(event.target.value, idx)}
              >
                <MenuItem value={-1} disabled>
                  <em>Pick a number</em>
                </MenuItem>
                <MenuItem value={0}>0</MenuItem>
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={4}>4</MenuItem>
                <MenuItem value={5}>5</MenuItem>
              </Select>
            </div>
          ) : null}
          {item.type === 'text' ? (
            <Input
              value={this.props.questions[idx].answer}
              onChange={(event) => this.props.updateQuestionAnswer(event.target.value, idx)}
              placeholder="Answer"
              fullWidth
              multiline
              maxRows="3"
              required
            />
          ) : null}
        </CardContent>
      </Card>
    ))

    return (
      <div>
        <div
          style={{
            fontWeight: 'bold',
            color: 'green',
            marginBottom: 20,
          }}
        >
          {this.props.projectInfo}
        </div>
        <form onSubmit={this.submitRegistration}>
          <div className="section registration-form">
            <CourseMaterial />
            <br />
            <div
              style={{
                marginBottom: 30,
                border: 'solid',
                padding: 20,
                borderRadius: 10,
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
                Huomaa, että projektiin osallistuminen edellyttää että kaikki esitietona olevat
                opintojaksot on suoritettu tai palautettu arvosteltavaksi projektin alkuun mennessä:
              </h3>
              <ul style={{ marginTop: '10px', marginBottom: '10px' }}>
                <li>
                  <a
                    href="https://studies.helsinki.fi/kurssit/opintojakso/otm-920b6fde-c155-4220-b672-21ea1b2bd3e4/TKT20006?cpId=hy-lv-77"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ohjelmistotuotanto
                  </a>
                </li>
                <li>
                  <a
                    href="https://studies.helsinki.fi/kurssit/opintojakso/otm-f15d8b61-6e3e-47d2-8191-43a92d7d8607/TKT20019"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Tietokannat ja Web-ohjelmointi
                  </a>
                </li>
                <li>
                  Yksi seuraavista:
                  <ul style={{ marginTop: '5px' }}>
                    <li>
                      <a
                        href="https://studies.helsinki.fi/kurssit/opintojakso/otm-e6d8ac50-806d-47f5-be72-74a47af9c07d/TKT20018?cpId=hy-lv-77"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Aineopintojen harjoitustyö: Ohjelmistotekniikka
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://studies.helsinki.fi/kurssit/opintojakso/otm-85bcf4bf-3797-46df-82b9-f5620bb5afd2/TKT20010?cpId=hy-lv-77"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Aineopintojen harjoitustyö: Algoritmit ja teköäly
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://studies.helsinki.fi/kurssit/opintojakso/otm-85bcf4bf-3797-46df-82b9-f5620bb5afd2/TKT20010?cpId=hy-lv-77"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Aineopintojen harjoitustyö: Tietorakenteet ja algoritmit
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://studies.helsinki.fi/kurssit/opintojakso/otm-bf72d0c0-94f2-46dd-98ab-c3503517b5f1/TKT20012?cpId=hy-lv-77"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Aineopintojen harjoitustyö: Tietoliikenne
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://studies.helsinki.fi/kurssit/opintojakso/otm-d351a53b-c18d-4c64-89da-39941d9d6d92/CSM141081?cpId=hy-lv-77"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Full stack -websovelluskehitys
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={this.state.prerequisitesReady}
                  onChange={this.togglePrerequisitesReady}
                  style={{ marginRight: '8px' }}
                />
                Vakuutan että esitiedot on suoritettu projektin alkuun mennessä
              </label>
            </div>
            {this.state.prerequisitesReady && (
              <>
                <h2 className="landingpage-header">User details</h2>
                <UserDetails />
                <p>Please fill your email</p>
                <div>
                  <TextField
                    type="email"
                    required
                    label="Email"
                    margin="normal"
                    style={{ width: '250px', marginTop: 0 }}
                    value={this.props.email}
                    onChange={(e) => this.props.updateEmail(e.target.value)}
                  />
                </div>
                <h2>Topics</h2>
                <div
                  style={{
                    fontWeight: 'bold',
                    marginBottom: 20,
                    border: 'solid',
                    padding: 10,
                    borderRadius: 10,
                  }}
                >
                  Set the order of the list of topics according to your preference (1 = favorite) by
                  dragging and dropping, click to expand details
                </div>
                <div className="dragndrop-container">
                  <SortableTopicList topics={this.props.topics} onUpdate={this.handleUpdate} />
                </div>
              </>
            )}
          </div>
          {this.state.prerequisitesReady && (
            <>
              <div className="section">
                <h2>Details</h2>
                <p>Please answer all questions</p>
                {questions}
              </div>

              <Prerequisites
                checkbox1={this.state.checkbox1}
                checkbox2={this.state.checkbox2}
                checkbox3={this.state.prerequisitesConfirmed}
                onToggle1={this.toggleCheckbox1}
                onToggle2={this.toggleCheckbox2}
                onToggle3={this.togglePrerequisitesConfirmed}
              />

              <Button
                type="submit"
                variant="outlined"
                disabled={
                  !this.state.checkbox1 ||
                  !this.state.checkbox2 ||
                  !this.state.prerequisitesConfirmed
                }
              >
                Submit your registration
              </Button>
            </>
          )}
        </form>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    user: state.login.user,
    topics: state.registrationPage.topics,
    questions: state.registrationPage.questions,
    email: state.registrationPage.email,
    projectConf: state.registrationManagement.projectRegistrationConf,
    projectOpen: state.registrationManagement.projectRegistrationOpen,
    projectInfo: state.registrationManagement.projectRegistrationInfo,
    ownRegistrations: state.registrations,
    registrationManagementFetched: state.registrationManagement.registrationManagementFetched,
  }
}

const mapDispatchToProps = {
  ...registrationPageActions,
  setError: notificationActions.setError,
  setSuccess: notificationActions.setSuccess,
  fetchRegistrations: registrationActions.fetchRegistrations,
  fetchRegistrationManagement: registrationmanagementActions.fetchRegistrationManagement,
}

const ConnectedRegistrationPage = connect(mapStateToProps, mapDispatchToProps)(RegistrationPage)

export default withRouter(ConnectedRegistrationPage)
