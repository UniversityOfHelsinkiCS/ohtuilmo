import userAIUsageService from '../../services/userAIUsageService'
import { setError } from './notificationActions'

export const createAIUsageAnswers = (aiUsageEntry) => {
  return async (dispatch) => {
    const sprintAIUsage = await userAIUsageService.postAIUsageAnswers(aiUsageEntry)
    if (sprintAIUsage.error) {
      dispatch(setError(`Error creating student AI usage answers: ${sprintAIUsage.error}`, 5000))
    } else {
      dispatch({
        type: 'CREATE_SPRINT_AI_ANSWERS',
        payload: sprintAIUsage,
      })
    }
  }
}

export const updateAIUsageAnswers = (aiUsageEntry) => {
  return async (dispatch) => {
    const updatedSprintAIUsage = await userAIUsageService.putAIUsageAnswers(aiUsageEntry)
    if (updatedSprintAIUsage.error) {
      dispatch(setError(`Error updating student AI usage answers: ${sprintAIUsage.error}`, 5000))
    } else {
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
    if (studentAIUsageAnswers.error) {
      dispatch(setError(`Error getting student AI usage answers: ${sprintAIUsage.error}`, 5000))
    } else {
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
    if (teacherAIUsageAnswerTeacher.error) {
      dispatch(
        setError(
          `Error getting students' AI usage answers for teacher: ${sprintAIUsage.error}`,
          5000,
        ),
      )
    } else {
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
    if (teacherAIUsageAnswerAdmin.error) {
      dispatch(setError(`Error getting student AI usage answers: ${sprintAIUsage.error}`, 5000))
    } else {
      dispatch({
        type: 'AI_USAGE_ADMIN',
        payload: teacherAIUsageAnswerAdmin,
      })
    }
  }
}
