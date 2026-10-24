import userAIUsageService from '../../services/userAIUsageService'

export const createAIUsageAnswers = (aiUsageEntry) => {
  return async (dispatch) => {
    const sprintAIUsage = await userAIUsageService.postAIUsageAnswers(aiUsageEntry)
    if (sprintAIUsage) {
      dispatch({
        type: 'CREATE_SPRINT_AI_ANSWERS',
        payload: sprintAIUsage,
      })
    }
  }
}

export const updateAIUsageAnswers = (aiUsageEntry, id) => {
  return async (dispatch) => {
    const updatedSprintAIUsage = await userAIUsageService.putAIUsageAnswers(aiUsageEntry, id)
    if (updatedSprintAIUsage) {
      dispatch({
        type: 'UPDATE_SPRINT_AI_ANSWERS',
        payload: updatedSprintAIUsage,
      })
    }
  }
}

export const fetchAIUsageAnswersStudent = () => {
  return async (dispatch) => {
    const studentAIUsageAnswers = await userAIUsageService.getAIUsageAnswersStudent()
    if (studentAIUsageAnswers) {
      dispatch({
        type: 'AI_USAGE_STUDENT',
        payload: studentAIUsageAnswers,
      })
    }
  }
}

export const fetchAIUsageAnswersTeacher = () => {
  return async (dispatch) => {
    const teacherAIUsageAnswerTeacher = await userAIUsageService.getAIUsageAnswersTeacher()
    if (teacherAIUsageAnswerTeacher) {
      dispatch({
        type: 'AI_USAGE_TEACHER',
        payload: teacherAIUsageAnswerTeacher,
      })
    }
  }
}

export const fetchAIUsageAnswersAdmin = () => {
  return async (dispatch) => {
    const teacherAIUsageAnswerAdmin = await userAIUsageService.getAIUsageAnswersAdmin()
    if (teacherAIUsageAnswerAdmin) {
      dispatch({
        type: 'AI_USAGE_ADMIN',
        payload: teacherAIUsageAnswerAdmin,
      })
    }
  }
}
