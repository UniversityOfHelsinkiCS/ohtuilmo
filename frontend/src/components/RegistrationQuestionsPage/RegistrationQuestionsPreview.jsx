import React, { useState } from 'react'
import PropTypes from 'prop-types'

import RegistrationQuestion from '../RegistrationQuestion'

// shows the questions the same way as students see them in the registration form
const RegistrationQuestionsPreview = ({ questions }) => {
  const [answers, setAnswers] = useState({})

  return (
    <div className="registration-questions-preview">
      {questions.map((question, idx) => (
        <RegistrationQuestion
          key={idx}
          question={question}
          answer={answers[idx] ?? (question.type === 'text' ? '' : undefined)}
          onAnswerChange={(answer) => setAnswers({ ...answers, [idx]: answer })}
        />
      ))}
    </div>
  )
}

RegistrationQuestionsPreview.propTypes = {
  questions: PropTypes.array.isRequired,
}

export default RegistrationQuestionsPreview
