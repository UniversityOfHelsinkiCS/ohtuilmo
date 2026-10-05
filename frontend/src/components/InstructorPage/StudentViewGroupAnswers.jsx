import React from 'react'
import { Table, TableRow, TableCell, TableHead, TableBody } from '@mui/material'

import './InstructorPage.css'

const PeerReviewAnswer = ({ answers, questionHeader, student }) => {
  const studentName = `${student.first_names} ${student.last_name}`

  return (
    <div className="padding-left-18">
      <h3>{questionHeader}</h3>
      <div className="padding-left-18">
        {answers.map((answer, index) => (
          <div className="peer-review-text" key={`peer-review-${index}`}>
            <p className="bold">
              {`${answer.student.first_names} ${answer.student.last_name}`} says:&nbsp;
            </p>
            <p>{answer.peers[studentName]}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const RadioAnswer = ({ answers, questionHeader, student }) => {
  const allPeers = answers.reduce((acc, answer) => {
    const fullName = `${answer.student.first_names} ${answer.student.last_name}`
    if (!acc.includes(fullName)) {
      acc.push(fullName)
    }
    return acc
  }, [])

  const studentName = `${student.first_names} ${student.last_name}`

  return (
    <div className="padding-left-18">
      <h3>{questionHeader}</h3>
      <div className="padding-left-18">
        <Table size="small" className="radio-button-table">
          <TableHead>
            <TableRow hover className="radio-inforow">
              <TableCell />
              {allPeers.map((peer, index) => (
                <TableCell
                  key={`radio-infoheader-${index}`}
                  className="radio-infoheader text-overflow-ellipsis"
                >
                  Reviewer
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
            <TableRow hover className="radio-row">
              <TableCell />
              {allPeers.map((peer) => (
                <TableCell key={peer} className="radio-header text-overflow-ellipsis">
                  {peer}
                </TableCell>
              ))}
              <TableCell className="radio-header text-overflow-ellipsis">
                Average <p>(without self-review)</p>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow hover className="peer-header">
              <TableCell>
                <p>{studentName}</p>
              </TableCell>
              {allPeers.map((peer, peerIndex) => (
                <TableCell key={peerIndex} className="radio-button">
                  {calculatePeerRating(studentName, peer, answers)}
                </TableCell>
              ))}
              <TableCell className="radio-button">
                {calculateAverageRating(studentName, answers)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

const calculatePeerRating = (member, peer, answers) => {
  const submission = answers.find(
    (answer) => `${answer.student.first_names} ${answer.student.last_name}` === peer,
  )
  return submission ? submission.peers[member] : '-'
}

const calculateAverageRating = (member, answers) => {
  const ratings = answers.reduce((acc, answer) => {
    const responderFullName = `${answer.student.first_names} ${answer.student.last_name}`

    if (responderFullName !== member && answer.peers[member] !== undefined) {
      acc.push(answer.peers[member])
    }
    return acc
  }, [])

  const sum = ratings.reduce((acc, rating) => acc + rating, 0)
  return ratings.length > 0 ? (sum / ratings.length).toFixed(2) : 'N/A'
}

const RadioOneLinerSimple = ({ answer, questionNumber, question }) => {
  const options = question.options
  return (
    <div className="padding-left-18">
      <Table size="small" className="radio-button-table">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            {options.map((option) => (
              <TableCell key={option}>{option}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>{answer.student.last_name}</TableCell>
            {options.map((_option, index) => {
              return (
                <TableCell key={`${answer.student.last_name}-${index}`}>
                  {answer.answer_sheet[questionNumber].answer === index ? 'x' : ''}
                </TableCell>
              )
            })}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

const StudentViewGroupAnswers = ({ answers }) => {
  return (
    <div className="padding-left-18 flex-column-72">
      {answers.map((studentAnswer, answerIndex) => (
        <div key={answerIndex} className="flex-column-16 divider-48">
          <h3 className="student-view-student-name">
            Reviews for {studentAnswer.student.first_names} {studentAnswer.student.last_name}
          </h3>
          {studentAnswer.answer_sheet.map((question, questionIndex) => {
            if (question.type === 'radio') {
              return (
                <RadioAnswer
                  key={questionIndex}
                  answers={answers.map((roundAnswer) => ({
                    student: roundAnswer.student,
                    peers: roundAnswer.answer_sheet[questionIndex].peers,
                  }))}
                  questionHeader={question.questionHeader}
                  student={studentAnswer.student}
                />
              )
            } else if (question.type === 'radioOneliner') {
              return (
                <RadioOneLinerSimple
                  key={questionIndex}
                  answer={studentAnswer}
                  questionNumber={questionIndex}
                  question={question}
                />
              )
            } else if (question.type === 'peerReview') {
              return (
                <PeerReviewAnswer
                  key={questionIndex}
                  answers={answers.map((roundAnswer) => ({
                    student: roundAnswer.student,
                    peers: roundAnswer.answer_sheet[questionIndex].peers,
                  }))}
                  questionHeader={question.questionHeader}
                  student={studentAnswer.student}
                />
              )
            } else {
              return (
                <div style={{ width: '70%' }} key={questionIndex}>
                  <h3>{question.questionHeader}</h3>
                  <p>{question.answer}</p>
                </div>
              )
            }
          })}
        </div>
      ))}
    </div>
  )
}

export default StudentViewGroupAnswers
