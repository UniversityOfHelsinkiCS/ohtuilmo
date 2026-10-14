import axios from 'axios'
import { BACKEND_API_BASE } from '../utils/config'
import { getUserToken } from '../utils/functions'

const url = `${BACKEND_API_BASE}/topics`

const create = async (content) => {
  const response = await axios.post(url, content)
  return response.data.topic
}

const copy = async (id) => {
  const config = {
    headers: { Authorization: 'bearer ' + getUserToken() },
  }
  const response = await axios.post(url + '/' + id + '/copy', null, config)
  return response.data.topic
}

const getAll = async () => {
  const config = {
    headers: { Authorization: 'bearer ' + getUserToken() },
  }
  const response = await axios.get(url, config)
  return response.data.topics
}

const getAllActive = async () => {
  const response = await axios.get(url + '/active')
  return response.data.topics
}

const update = async (topic) => {
  const config = {
    headers: { Authorization: 'bearer ' + getUserToken() },
  }
  const response = await axios.put(url + '/' + topic.id, topic, config)
  return response.data.topic
}

const getOne = async (id) => {
  const config = {
    headers: { Authorization: 'bearer ' + getUserToken() },
  }
  const response = await axios.get(url + '/' + id, config)
  return response.data.topic
}

export default { create, getAll, getAllActive, getOne, update, copy }
