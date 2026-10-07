const initialState = {
  username: '',
  password: '',
  user: null,
}

const loginReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'LOGIN_USER':
      return {
        username: '',
        password: '',
        user: action.payload,
      }
    case 'LOGOUT_USER':
      return {
        ...state,
        user: null,
      }
    case 'UPDATE_CONSENT':
      return {
        ...state,
        research_consent: action.payload,
      }
    case 'UPDATE_USERNAME':
      return {
        ...state,
        username: action.payload,
      }
    case 'UPDATE_PASSWORD':
      return {
        ...state,
        password: action.payload,
      }
    case 'CLEAR_FORM':
      return {
        ...state,
        username: '',
        password: '',
      }
    default:
      return state
  }
}

export default loginReducer
