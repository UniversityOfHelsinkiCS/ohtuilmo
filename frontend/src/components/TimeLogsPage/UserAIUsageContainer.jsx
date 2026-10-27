import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchAIUsageAnswersStudent } from '../../reducers/actions/userAIUsageActions'
import { Container } from '@mui/material'
import { UserAIUsageForm } from './UserAIUsageForm'

const AIUsageContainer = ({ currentSprintId, groupId }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchAIUsageAnswersStudent())
  }, [dispatch])

  return (
    <Container>{<UserAIUsageForm currentSprintId={currentSprintId} groupId={groupId} />}</Container>
  )
}

export default AIUsageContainer
