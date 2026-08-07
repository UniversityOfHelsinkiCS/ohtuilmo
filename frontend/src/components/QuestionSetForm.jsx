import React, { useState } from 'react'
import TextField from '@mui/material/TextField'
import './QuestionSetForm.css'

const validateQuestionsJson = (str) => {
  try {
    const obj = JSON.parse(str)
    if (!Array.isArray(obj)) {
      return { ok: false, error: 'Questions should be an array' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Field contains invalid JSON' }
  }
}

const QuestionSetForm = ({ initialName, initialQuestionsJson, onSubmit, controls }) => {
  const [name, setName] = useState(initialName || '')
  const [questionsJson, setQuestionsJson] = useState(initialQuestionsJson || '')
  const [questionsError, setQuestionsError] = useState('')

  const clearQuestionsError = () => {
    if (questionsError !== '') {
      setQuestionsError('')
    }
  }

  const handleNameChange = (e) => setName(e.target.value)

  const handleQuestionsChange = (e) => {
    setQuestionsJson(e.target.value)
    clearQuestionsError()
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()

    const { ok, error } = validateQuestionsJson(questionsJson)
    if (!ok) {
      setQuestionsError(error)
      return
    }

    onSubmit(name, questionsJson)
    setName('')
    setQuestionsJson('')
  }

  return (
    <form className="question-set-form" onSubmit={handleFormSubmit}>
      <TextField
        className="question-set-form__name"
        fullWidth
        required
        label="Name"
        margin="normal"
        value={name}
        onChange={handleNameChange}
      />
      <TextField
        className="question-set-form__questions"
        error={!!questionsError}
        inputProps={{
          style: {
            fontFamily: 'source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
            fontSize: '0.9em',
          },
        }}
        fullWidth
        required
        label="Questions (JSON)"
        helperText={questionsError || ''}
        margin="normal"
        multiline
        rows={28}
        value={questionsJson}
        onChange={handleQuestionsChange}
        placeholder={`
        Available question types:
        
        - number
        - radio
        - peerReview (individual text fields for each team member)
        - text (single text field)
        
        For example:

        [
          {
            "type": "number",
            "header": "Kuinka monta tuntia käytit projektin parissa?",
            "description": "Arvioi käyttämäsi aika tunteina."
          },
          {
            "type": "radio",
            "header": "Tiimin jäsenten tekninen kontribuutio",
            "options": [1, 2, 3, 4, 5]
          },
          {
            "type": "peerReview",
            "header": "Teknisen kontribuution arviointi",
            "description": "Arvioi sanallisesti tiimin jäsenten teknistä kontribuutiota."
          }
        ]
      `}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      {controls}
    </form>
  )
}

export default QuestionSetForm
