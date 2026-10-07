import axios from 'axios'
import { BACKEND_API_BASE } from '../utils/config'
import { getUserToken } from '../utils/functions'

const url = `${BACKEND_API_BASE}/users`

const get = async () => {
  const response = await axios.get(url, {
    headers: { Authorization: 'bearer ' + getUserToken() },
  })

  return response.data
}

const update = async (user) => {
  const config = {
    headers: { Authorization: 'bearer ' + getUserToken() },
  }
  const response = await axios.put(url + `/${user.student_number}`, user.email, config)
  return response.data
}

const updateUserConsent = async (consent, user) => {
  const config = {
    headers: { Authorization: 'bearer ' + getUserToken() },
  }
  const studentNumber = user.student_number
  const response = await axios.put(
    url + '/consent/' + studentNumber,
    { research_consent: consent },
    config,
  )
  return response.data
}

const checkInstructor = async (token) => {
  const config = {
    headers: { Authorization: 'bearer ' + token },
  }
  const response = await axios.get(`${url}/isInstructor`, config)
  return response.data
}

export default { get, update, checkInstructor, updateUserConsent }
