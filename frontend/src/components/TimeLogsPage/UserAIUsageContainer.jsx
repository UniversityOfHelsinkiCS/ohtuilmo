import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchAIUsageAnswersStudent } from '../../reducers/actions/userAIUsageActions'
import { Container } from '@mui/material'
import { UserAIUsageForm } from './UserAIUsageForm'

const AIUsageContainer = ({ currentSprint, groupId, selected }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchAIUsageAnswersStudent())
  }, [dispatch])

  return (
    <Container>
      {
        <UserAIUsageForm
          currentSprint={currentSprint}
          groupId={groupId}
          selectedSprint={selected}
        />
      }
    </Container>
  )
}

export default AIUsageContainer
