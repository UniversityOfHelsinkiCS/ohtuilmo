const intialState = {
  answersStudent: [],
  answersTeacher: [],
  answersAdmin: [],
}

const userAIUsageReducer = (state = intialState, action) => {
  switch (action.type) {
    case 'CREATE_SPRINT_AI_ANSWERS':
      return {
        ...state,
        answersStudent: action.payload,
      }
    case 'UPDATE_SPRINT_AI_ANSWERS':
      return {
        ...state,
        answersStudent: action.payload,
      }
    case 'AI_USAGE_STUDENT':
      return {
        ...state,
        answersStudent: action.payload,
      }
    case 'AI_USAGE_TEACHER':
      return {
        ...state,
        answersTeacher: action.payload,
      }
    case 'AI_USAGE_ADMIN':
      return {
        ...state,
        answersAdmin: action.payload,
      }
    default:
      return state
  }
}

export default userAIUsageReducer
