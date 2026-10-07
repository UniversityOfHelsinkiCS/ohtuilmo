import loginService from '../../services/login'
import userService from '../../services/user'
import logoutService from '../../services/logout'

const updateIsInstructor = (user, isInstructor) => ({
  ...user,
  instructor: isInstructor,
})

export const updateConsent = (consent, user) => {
  return async (dispatch) => {
    const { user: updatedUser } = await userService.updateUserConsent(consent, user)
    dispatch({
      type: 'UPDATE_CONSENT',
      payload: {
        research_consent: updatedUser.research_consent,
      },
    })
  }
}

export const loginUser = (userCredentials) => {
  return async (dispatch) => {
    const { user, token } = await loginService.login(userCredentials)
    const { isInstructor } = await userService.checkInstructor(token)

    dispatch({
      type: 'LOGIN_USER',
      payload: {
        token,
        user: updateIsInstructor(user, isInstructor),
      },
    })
  }
}

export const logoutUser = () => {
  return async () => {
    const logoutUrl = await logoutService.logout()
    //dispatch({ type: 'LOGOUT_USER' })
    localStorage.clear()
    window.location = logoutUrl
  }
}
