import configurationService from '../../services/configuration'

const fetchConfigurations = () => {
  return async (dispatch) => {
    const response = await configurationService.getAll()
    const configurations = response.configurations.reverse()
    dispatch({ type: 'SET_CONFIGURATIONS', payload: configurations })
    return configurations
  }
}

const setConfigurations = (configurations) => {
  return {
    type: 'SET_CONFIGURATIONS',
    payload: configurations,
  }
}

const updateConfigurations = (configuration) => {
  return {
    type: 'UPDATE_CONFIGURATIONS',
    payload: configuration,
  }
}

const updateSelectedConfig = (configuration) => {
  return {
    type: 'UPDATE_SELECTED_CONFIG',
    payload: configuration,
  }
}

const setRegistrationQuestions = (questions) => {
  return {
    type: 'SET_REGISTRATION_QUESTIONS',
    payload: questions,
  }
}

const setReviewQuestions = (questions) => {
  return {
    type: 'SET_REVIEW_QUESTIONS',
    payload: questions,
  }
}

const setCustomerReviewQuestions = (questions) => {
  return {
    type: 'SET_CUSTOMER_REVIEW_QUESTIONS',
    payload: questions,
  }
}

const updateSelectedRegistrationQuestions = (selected) => {
  return {
    type: 'UPDATE_SELECTED_REGISTRATION_QUESTIONS',
    payload: selected,
  }
}

const updateSelectedReviewQuestions1 = (selected) => {
  return {
    type: 'UPDATE_SELECTED_REVIEW_QUESTIONS_1',
    payload: selected,
  }
}

const updateSelectedReviewQuestions2 = (selected) => {
  return {
    type: 'UPDATE_SELECTED_REVIEW_QUESTIONS_2',
    payload: selected,
  }
}

const updateSelectedCustomerReviewQuestions = (selected) => {
  return {
    type: 'UPDATE_SELECTED_CUSTOMER_REVIEW_QUESTIONS',
    payload: selected,
  }
}

const selectNewConfig = () => {
  return {
    type: 'SELECT_NEW_CONFIG',
  }
}

const updateConfigForm = (configuration) => {
  return {
    type: 'UPDATE_CONFIG_FORM',
    payload: configuration,
  }
}

const updateActive = (active) => {
  return {
    type: 'UPDATE_ACTIVE',
    payload: active,
  }
}

const updateConfigName = (name) => {
  return {
    type: 'UPDATE_CONFIG_NAME',
    payload: name,
  }
}

const updateNewStatus = (status) => {
  return {
    type: 'UPDATE_NEW_STATUS',
    payload: status,
  }
}

export default {
  fetchConfigurations,
  setConfigurations,
  updateConfigurations,
  updateSelectedConfig,
  setRegistrationQuestions,
  setReviewQuestions,
  setCustomerReviewQuestions,
  updateSelectedRegistrationQuestions,
  updateSelectedReviewQuestions1,
  updateSelectedReviewQuestions2,
  updateSelectedCustomerReviewQuestions,
  selectNewConfig,
  updateActive,
  updateConfigForm,
  updateConfigName,
  updateNewStatus,
}
