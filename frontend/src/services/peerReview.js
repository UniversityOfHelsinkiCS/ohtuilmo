import axios from 'axios'
import { BACKEND_API_BASE } from '../utils/config'
import { getUserToken } from '../utils/functions'

const url = `${BACKEND_API_BASE}/peerReview`

const get = async () => {
  const response = await axios.get(url, {
    headers: { Authorization: 'Bearer ' + getUserToken() },
  })
  return response.data
}
const getAnswersByInstructor = async () => {
  const response = await axios.get(url + '/forInstructor', {
    headers: { Authorization: 'Bearer ' + getUserToken() },
  })
  return response.data
}

const create = async (peerReview) => {
  const response = await axios.post(url, peerReview, {
    headers: { Authorization: 'Bearer ' + getUserToken() },
  })

  return response.data
}

const getReviewQuestions = async (configurationId, reviewRound) => {
  const response = await axios.get(
    `${BACKEND_API_BASE}/configurations/${configurationId}/reviewquestions/${reviewRound}`,
    {
      headers: { Authorization: 'Bearer ' + getUserToken() },
    },
  )

  return response.data
}

const remove = async (id) => {
  await axios.delete(`${url}/${id}`, {
    headers: { Authorization: 'Bearer ' + getUserToken() },
  })
}

export default { get, create, remove, getReviewQuestions, getAnswersByInstructor }
