import { withRouter } from '../utils/withRouter'
import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import './TopicFormPage.css'

// MUI
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionActions from '@mui/material/AccordionActions'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Divider from '@mui/material/Divider'

// Service
import configurationService from '../services/configuration'
import registrationManagementService from '../services/registrationManagement'
import registrationQuestionSetService from '../services/registrationQuestionSet'
import reviewQuestionSetService from '../services/peerReviewQuestionSet'
import customerReviewQuestionService from '../services/customerReviewQuestionSet'
// Actions
import configurationPageActions from '../reducers/actions/configurationPageActions'
import * as notificationActions from '../reducers/actions/notificationActions'
import questionsFormPageActions from '../reducers/actions/questionsFormPageActions'

import RegistrationQuestionsTable from './RegistrationQuestionsTable'
import PeerReviewQuestionsTable from './PeerReviewQuestionsTable'

const SelectedSetName = ({ questionSet }) => (
  <p
    style={{
      marginLeft: 32,
      fontWeight: questionSet ? 600 : 'normal',
      opacity: questionSet ? 1 : 0.6,
    }}
  >
    {questionSet ? questionSet.name : 'No set selected'}
  </p>
)

const ConfigurationPage = (props) => {
  useEffect(() => {
    setQuestions()

    const fetchConfigurations = async () => {
      try {
        const configurations = await props.fetchConfigurations()
        // keep a configuration that was already selected earlier
        if (!props.selectedConfig) {
          await selectCurrentConfiguration(configurations)
        }
      } catch (err) {
        console.log(err)
        props.setError('Error fetching configurations', 5000)
      }
    }

    fetchConfigurations()
  }, [])

  // the current configuration is the one used by the peer review
  const selectCurrentConfiguration = async (configurations) => {
    const { registrationManagement } = await registrationManagementService.get()
    const currentConfiguration = configurations.find(
      (configuration) => configuration.id === registrationManagement.peer_review_conf,
    )
    if (currentConfiguration) {
      props.updateSelectedConfig(currentConfiguration)
      props.updateConfigForm(currentConfiguration)
      props.updateNewStatus(false)
    }
  }

  const setQuestions = async () => {
    try {
      const registrationQuestions = await registrationQuestionSetService.getAll()
      props.setRegistrationQuestions(registrationQuestions)

      const reviewQuestions = await reviewQuestionSetService.getAll()
      props.setReviewQuestions(reviewQuestions)

      const customerReviewQuestions = await customerReviewQuestionService.getAll()
      props.setCustomerReviewQuestions(customerReviewQuestions)
    } catch (e) {
      console.log('error happened', e)
      props.setError('Error fetching question sets', 5000)
    }
  }

  const handleConfigurationChange = (event) => {
    if (event.target.value === 'new') {
      props.selectNewConfig()
      props.updateNewStatus(true)
    } else {
      props.updateSelectedConfig(event.target.value)
      props.updateConfigForm(event.target.value)
      props.updateNewStatus(false)
    }
  }

  const handleQuestionSetChange = (event) => {
    if (event.target.name === 'registration') {
      const value = props.allRegistrationQuestions.find(
        (questions) => questions.id === event.target.value,
      )
      console.log(
        'VALUE FOR REGISTRATION:',
        value,
        event.target.value,
        props.allRegistrationQuestions,
      )
      props.updateSelectedRegistrationQuestions(value)
    } else if (event.target.name === 'review1') {
      const value = props.allReviewQuestions.find(
        (questions) => questions.id === event.target.value,
      )
      props.updateSelectedReviewQuestions1(value)
    } else if (event.target.name === 'review2') {
      const value = props.allReviewQuestions.find(
        (questions) => questions.id === event.target.value,
      )
      props.updateSelectedReviewQuestions2(value)
    } else if (event.target.name === 'customer-review') {
      const value = props.allCustomerReviewQuestions.find(
        (questions) => questions.id === event.target.value,
      )
      props.updateSelectedCustomerReviewQuestions(value)
    }
  }

  const saveNewConfig = async (event) => {
    event.preventDefault()
    const configuration = { ...props.form }
    try {
      const response = await configurationService.create(configuration)
      props.setConfigurations([...props.configurations, response.configuration])
      props.updateSelectedConfig(response.configuration)
      props.updateNewStatus(false)
      props.setSuccess('New configuration saved', 5000)
    } catch (e) {
      console.log(e)
      props.setError('Error saving new configuration', 5000)
    }
  }

  const updateConfig = async (event) => {
    event.preventDefault()
    try {
      const configuration = { ...props.form }
      const response = await configurationService.update(configuration, props.selectedConfig.id)
      props.updateConfigurations(response.configuration)
      props.updateSelectedConfig(response.configuration)
      props.updateConfigForm(response.configuration)
      props.setSuccess('Configuration updated', 5000)
    } catch (e) {
      console.log(e)
      props.setError('Error saving edits to configuration', 5000)
    }
  }

  const goToAddRegistrationQuestions = () => {
    props.history.push('/administration/registration-questions')
  }

  const goToAddReviewQuestions = () => {
    props.history.push('/administration/peer-review-questions')
  }

  const goToAddCustomerReviewQuestions = () => {
    props.history.push('/administration/customer-review-questions')
  }

  return (
    <div className="admin-page-container">
      <h3>Change configuration</h3>
      <Select
        value={props.selectedConfig ? props.selectedConfig : 'new'}
        onChange={handleConfigurationChange}
      >
        <MenuItem value="new">New</MenuItem>
        {/* newest first, ids follow the order of creation */}
        {[...props.configurations]
          .sort((a, b) => b.id - a.id)
          .map((item) => (
            <MenuItem key={item.id} value={item}>
              {item.name}
            </MenuItem>
          ))}
      </Select>
      <div>
        <TextField
          label="Nimi"
          required
          margin="normal"
          value={props.form.name}
          onChange={(e) => props.updateConfigName(e.target.value)}
        />
      </div>
      <h3>Questions</h3>
      <div style={{ paddingBottom: 10 }}>
        <Accordion data-cy="expansion-registration-questions">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <p>Registration questions</p>
              <SelectedSetName questionSet={props.selectedRegister} />
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <div>
              <Divider />
              {props.selectedRegister && (
                <RegistrationQuestionsTable questions={props.selectedRegister.questions} />
              )}
            </div>
          </AccordionDetails>
          <AccordionActions>
            <Select
              name="registration"
              value={props.selectedRegister ? props.selectedRegister.id : 'default'}
              onChange={handleQuestionSetChange}
            >
              <MenuItem value="default" disabled>
                Pick registration questions
              </MenuItem>
              {props.allRegistrationQuestions.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
            <Button
              style={{ marginRight: '10px', height: '40px' }}
              color="primary"
              variant="contained"
              onClick={goToAddRegistrationQuestions}
            >
              Configure
            </Button>
          </AccordionActions>
        </Accordion>
        <Accordion data-cy="expansion-review-questions-1">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <p>Peer review questions 1</p>
              <SelectedSetName questionSet={props.selectedReview1} />
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <div>
              <Divider />
              {props.selectedReview1 && (
                <PeerReviewQuestionsTable questions={props.selectedReview1.questions} />
              )}
            </div>
          </AccordionDetails>
          <AccordionActions>
            <Select
              data-cy="select-review-questions-1"
              name="review1"
              value={props.selectedReview1 ? props.selectedReview1.id : 'default'}
              onChange={handleQuestionSetChange}
            >
              <MenuItem value="default" disabled>
                Pick review 1 questions
              </MenuItem>
              {props.allReviewQuestions.map((item) => (
                <MenuItem key={item.id} value={item.id} data-cy="menu-item-review-questions-1">
                  {item.name}
                </MenuItem>
              ))}
            </Select>
            <Button
              style={{ marginRight: '10px', height: '40px' }}
              color="primary"
              variant="contained"
              onClick={goToAddReviewQuestions}
            >
              Configure
            </Button>
          </AccordionActions>
        </Accordion>
        <Accordion data-cy="expansion-review-questions-2">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <p>Peer review questions 2</p>
              <SelectedSetName questionSet={props.selectedReview2} />
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <div>
              <Divider />
              {props.selectedReview2 && (
                <PeerReviewQuestionsTable questions={props.selectedReview2.questions} />
              )}
            </div>
          </AccordionDetails>
          <AccordionActions>
            <Select
              name="review2"
              value={props.selectedReview2 ? props.selectedReview2.id : 'default'}
              onChange={handleQuestionSetChange}
            >
              <MenuItem value="default" disabled>
                Pick review 2 questions
              </MenuItem>
              {props.allReviewQuestions.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
            <Button
              style={{ marginRight: '10px', height: '40px' }}
              color="primary"
              variant="contained"
              onClick={goToAddReviewQuestions}
            >
              Configure
            </Button>
          </AccordionActions>
        </Accordion>
        <Accordion data-cy="expansion-customer-review-questions">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <p>Customer review questions</p>
              <SelectedSetName questionSet={props.selectedCustomerReview} />
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <div>
              <Divider />
              {props.selectedCustomerReview && (
                <PeerReviewQuestionsTable questions={props.selectedCustomerReview.questions} />
              )}
            </div>
          </AccordionDetails>
          <AccordionActions>
            <Select
              name="customer-review"
              value={props.selectedCustomerReview ? props.selectedCustomerReview.id : 'default'}
              onChange={handleQuestionSetChange}
            >
              <MenuItem value="default" disabled>
                Pick customer review questions
              </MenuItem>
              {props.allCustomerReviewQuestions.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
            <Button
              style={{ marginRight: '10px', height: '40px' }}
              color="primary"
              variant="contained"
              onClick={goToAddCustomerReviewQuestions}
            >
              Configure
            </Button>
          </AccordionActions>
        </Accordion>
        <div style={{ marginTop: '10px' }}>
          <Switch
            style={{ marginRight: '10px', height: '40px' }}
            color="primary"
            variant="contained"
            checked={props.form.active}
            onChange={(e) => props.updateActive(e.target.checked)}
          />
          <p style={{ display: 'inline' }}>{props.form.active ? 'Active' : 'Closed'}</p>
        </div>
      </div>
      <Button
        color="primary"
        variant="contained"
        onClick={props.isNew ? saveNewConfig : updateConfig}
      >
        Save
      </Button>
    </div>
  )
}

const mapStateToProps = (state) => ({
  configurations: state.configurationPage.configurations,
  selectedConfig: state.configurationPage.selectedConfig,
  allRegistrationQuestions: state.configurationPage.allRegistrationQuestions,
  allReviewQuestions: state.configurationPage.allReviewQuestions,
  allCustomerReviewQuestions: state.configurationPage.allCustomerReviewQuestions,
  selectedRegister: state.configurationPage.selectedRegister,
  selectedReview1: state.configurationPage.selectedReview1,
  selectedReview2: state.configurationPage.selectedReview2,
  selectedCustomerReview: state.configurationPage.selectedCustomerReview,
  form: state.configurationPage.form,
  isNew: state.configurationPage.isNew,
})

const mapDispatchToProps = {
  ...configurationPageActions,
  ...questionsFormPageActions,
  setError: notificationActions.setError,
  setSuccess: notificationActions.setSuccess,
  fetchConfigurations: configurationPageActions.fetchConfigurations,
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ConfigurationPage))
