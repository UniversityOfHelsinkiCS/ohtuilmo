import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  fetchAIUsageAnswersStudent,
  fetchAIUsageAnswersTeacher,
} from '../../reducers/actions/userAIUsageActions'
import { Container } from '@mui/material'
import { UserAIUsageForm } from './UserAIUsageForm'
import { UserAIUsageChart } from './UserAIUsageChart'

const AIUsageContainer = ({ currentSprint, user, groupId, selected }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchAIUsageAnswersStudent())
    if (user.admin || user.instructor) {
      dispatch(fetchAIUsageAnswersTeacher())
    }
  }, [dispatch, user.admin, user.instructor])

  return (
    <Container>
      {
        <UserAIUsageForm
          currentSprint={currentSprint}
          groupId={groupId}
          selectedSprint={selected}
        />
      }
      {(user.admin || user.instructor) && <UserAIUsageChart />}
    </Container>
  )
}

export default AIUsageContainer
