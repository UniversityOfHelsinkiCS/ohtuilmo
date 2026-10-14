import React from 'react'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Markdown from './common/Markdown'
import { connect } from 'react-redux'
import './Topic.css'

const Topic = ({
  content,
  isEditable,
  onPageChange,
  isAdmin,
  copyToConfiguration,
  summer,
  dates,
}) => {
  const ipRights =
    content.ipRights === 'nonopen'
      ? 'The customer retains the intellectual property rights to the project.'
      : 'Software is published under an open source license'

  return (
    <div className="single-topic-container">
      <div className="block">
        <Typography variant="h5" id="title">
          {content.title}
        </Typography>
      </div>
      <div className="block">
        <p className="title" style={{ paddingBottom: 7 }}>
          Customer
        </p>
        <Typography variant="body1">{content.customerName}</Typography>
      </div>
      {content.organisation && (
        <div className="block">
          <p className="title" style={{ paddingBottom: 7 }}>
            Organisation type
          </p>
          <Typography variant="body1">{content.organisation}</Typography>
        </div>
      )}
      <div className="block">
        <p className="title" style={{ paddingBottom: 7 }}>
          Contact email
        </p>
        <Typography variant="body1">{content.email}</Typography>
      </div>
      {content.phoneNumber && (
        <div className="block">
          <p className="title" style={{ paddingBottom: 7 }}>
            Phone number
          </p>
          <Typography variant="body1">{content.phoneNumber}</Typography>
        </div>
      )}
      {summer && content.summerDates && (
        <div className="block">
          <p className="title">Suitable timing</p>
          <ul>
            {content.summerDates.short && <li>the early summer project {dates.short}</li>}
            {content.summerDates.long && <li>the whole summer project {dates.long}</li>}
          </ul>
        </div>
      )}
      <div className="block">
        <p className="title" style={{ paddingBottom: 7 }}>
          Intellectual property rights
        </p>
        <Typography variant="body1">{ipRights}</Typography>
      </div>

      <div className="block">
        <p className="title">Description</p>
        <Markdown>{content.description}</Markdown>
      </div>
      <div className="block">
        <p className="title">Implementation environment</p>
        <Markdown>{content.environment}</Markdown>
      </div>
      <div className="block">
        <p className="title">Special requests</p>
        {content.specialRequests ? (
          <Markdown>{content.specialRequests}</Markdown>
        ) : (
          <div style={{ paddingTop: 7 }}>-</div>
        )}
      </div>
      <div className="block">
        <p className="title">Additional information</p>
        {content.additionalInfo ? (
          <Markdown>{content.additionalInfo}</Markdown>
        ) : (
          <div style={{ paddingTop: 7 }}>-</div>
        )}
      </div>
      {isEditable && (
        <div className="topic-edit-button">
          <Button variant="contained" color="primary" onClick={onPageChange}>
            Edit
          </Button>
        </div>
      )}
      {isAdmin && (
        <div className="topic-edit-button">
          <Button variant="contained" color="default" onClick={copyToConfiguration}>
            Copy to most recent configuration
          </Button>
        </div>
      )}
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    summer: state.registrationManagement.summerProject,
    dates: state.registrationManagement.summerDates,
  }
}

const ConnectedTopic = connect(mapStateToProps, null)(Topic)

export default ConnectedTopic
