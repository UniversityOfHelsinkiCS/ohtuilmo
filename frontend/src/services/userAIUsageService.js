import axios from 'axios'
import { BACKEND_API_BASE } from '../utils/config'
import { getUserToken } from '../utils/functions'

const aiUsageUrl = `${BACKEND_API_BASE}/aiusage`

const getAIUsageAnswersStudent = async () => {
  try {
    const response = await axios.get(`${aiUsageUrl}/student`, {
      headers: { Authorization: `Bearer ${getUserToken()}` },
    })
    return response.data
  } catch (error) {
    console.error('Error getting student AI usage answers', error.response.data.error)
    return error.response.data
  }
}

const getAIUsageAnswersTeacher = async () => {
  try {
    const response = await axios.get(`${aiUsageUrl}/teacher`, {
      headers: { Authorization: `Bearer ${getUserToken()}` },
    })
    return response.data
  } catch (error) {
    console.error('Error getting students` AI usage answers for teacher', error.response.data.error)
    return error.response.data
  }
}

const getAIUsageAnswersAdmin = async () => {
  try {
    const response = await axios.get(`${aiUsageUrl}/admin`, {
      headers: { Authorization: `Bearer ${getUserToken()}` },
    })
    return response.data
  } catch (error) {
    console.error('Error getting all AI usage answers', error.response.data.error)
    return error.response.data
  }
}

const postAIUsageAnswers = async (aiUsageEntry) => {
  try {
    const response = await axios.post(`${aiUsageUrl}`, aiUsageEntry, {
      headers: { Authorization: `Bearer ${getUserToken()}` },
    })
    return response.data
  } catch (error) {
    console.error('Error creating student AI usage answers', error.response.data.error)
    return error.response.data
  }
}

const putAIUsageAnswers = async (aiUsageEntry, id) => {
  try {
    const response = await axios.put(`${aiUsageUrl}/${id}`, aiUsageEntry, {
      headers: { Authorization: `Bearer ${getUserToken()}` },
    })
    return response.data
  } catch (error) {
    console.error('Error updating student AI usage answers', error.response.data.error)
    return error.response.data
  }
}

export default {
  getAIUsageAnswersAdmin,
  getAIUsageAnswersTeacher,
  getAIUsageAnswersStudent,
  postAIUsageAnswers,
  putAIUsageAnswers,
}
