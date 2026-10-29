import { withRouter } from '../utils/withRouter'
import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import * as notificationActions from '../reducers/actions/notificationActions'

import './LandingPage.css'

import registrationActions from '../reducers/actions/registrationActions'
import { Container } from '@mui/material'

class LandingPage extends React.Component {
  componentDidMount() {
    this.fetchOwnregistrations()
  }

  fetchOwnregistrations = async () => {
    try {
      await this.props.fetchRegistrations()
      if (this.props.ownRegistrations.length > 0) {
        this.props.history.push('/registrationdetails')
      }
    } catch (e) {
      console.log('error happened', e)
      this.props.setError('Error fetching own registration... try reloading the page', 3000)
    }
  }

  render() {
    return (
      <Container>
        <div className="landingpage-container">
          <h2 className="landingpage-header">Home</h2>
          {this.props.projectOpen ? (
            <Link to="/register" data-cy="registrationlink">
              Submit your registration
            </Link>
          ) : (
            <div className="landingpage-message">{this.props.projectMessage}</div>
          )}
        </div>
      </Container>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    projectOpen: state.registrationManagement.projectRegistrationOpen,
    projectMessage: state.registrationManagement.projectRegistrationMessage,
    ownRegistrations: state.registrations,
  }
}

const mapDispatchToProps = {
  fetchRegistrations: registrationActions.fetchRegistrations,
  setError: notificationActions.setError,
  setSuccess: notificationActions.setSuccess,
}

const ConnectedLandingPage = connect(mapStateToProps, mapDispatchToProps)(LandingPage)

export default withRouter(ConnectedLandingPage)
