import React from 'react'
import PropTypes from 'prop-types'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Input from '@mui/material/Input'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// one question of the registration form, as students see it
const RegistrationQuestion = ({ question, answer, onAnswerChange }) => (
  <Card style={{ marginBottom: '10px' }}>
    <CardContent>
      <p>{question.question}</p>
      {question.type === 'scale' ? (
        <div>
          <Select
            value={answer === undefined ? -1 : answer}
            onChange={(event) => onAnswerChange(event.target.value)}
          >
            <MenuItem value={-1} disabled>
              <em>Pick a number</em>
            </MenuItem>
            <MenuItem value={0}>0</MenuItem>
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={2}>2</MenuItem>
            <MenuItem value={3}>3</MenuItem>
            <MenuItem value={4}>4</MenuItem>
            <MenuItem value={5}>5</MenuItem>
          </Select>
        </div>
      ) : null}
      {question.type === 'text' ? (
        <Input
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          placeholder="Answer"
          fullWidth
          multiline
          maxRows="3"
          required
        />
      ) : null}
    </CardContent>
  </Card>
)

RegistrationQuestion.propTypes = {
  question: PropTypes.object.isRequired,
  answer: PropTypes.any,
  onAnswerChange: PropTypes.func.isRequired,
}

export default RegistrationQuestion
