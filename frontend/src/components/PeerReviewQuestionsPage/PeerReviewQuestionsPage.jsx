import { withRouter } from '../../utils/withRouter'
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Paper from '@mui/material/Paper'
import CollapsibleHeading from '../common/CollapsibleHeading'

import {
  fetchPeerReviewQuestionSets,
  updatePeerReviewQuestionSet,
} from '../../reducers/actions/peerReviewQuestionsPageActions'
import { setError, setSuccess } from '../../reducers/actions/notificationActions'

import { peerReviewQuestionSetShape } from '../common/sharedPropTypes'
import PeerReviewQuestionSetList from './PeerReviewQuestionSetList'
import CreatePeerReviewQuestionSet from './CreatePeerReviewQuestionSet'
import './PeerReviewQuestionsPage.css'

const isValidationError = (e) => e.response && e.response.status === 400

class PeerReviewQuestionsPage extends React.Component {
  state = {
    // ids of the sets that existed when the page was opened, null until loaded
    initialIds: null,
    createFormOpen: false,
  }

  async componentDidMount() {
    await this.loadQuestionSets()
  }

  async loadQuestionSets() {
    try {
      await this.props.fetchPeerReviewQuestionSets()
    } catch (err) {
      this.handleError(err)
    }
    this.setState({ initialIds: new Set(this.props.questionSets.map((set) => set.id)) })
  }

  handleError = (e) => {
    const { setError } = this.props

    console.error('error happened', e, e.response)
    if (isValidationError(e)) {
      // was error 400, server should have responded { "error": "..." }
      setError(`An error occurred: "${e.response.data.error}"!`, 5000)
    } else {
      setError('Some error happened', 3000)
    }
  }

  handleSuccess = (message) => {
    this.props.setSuccess(message, 3000)
  }

  handleQuestionSetUpdate = async (updatedQuestionSet) => {
    try {
      await this.props.updatePeerReviewQuestionSet(updatedQuestionSet)
      this.handleSuccess(`Updated question set "${updatedQuestionSet.name}"!`)
    } catch (err) {
      this.handleError(err)
    }
  }

  render() {
    const { questionSets } = this.props
    const { initialIds, createFormOpen } = this.state

    return (
      <div className="peer-review-questions-page">
        <h1>Configure peer review questions</h1>
        <div className="peer-review-questions-page__container">
          <section style={{ marginBottom: '2rem' }}>
            <CollapsibleHeading
              title="Create question set"
              open={createFormOpen}
              onToggle={() => this.setState({ createFormOpen: !createFormOpen })}
              toggleClassName="peer-review-questions-page__create-toggle"
            />
            {createFormOpen && (
              <Paper depth={1} className="peer-review-questions-page__create-form">
                <CreatePeerReviewQuestionSet />
              </Paper>
            )}
          </section>
          <section>
            <h2>Question sets</h2>
            {initialIds && (
              <PeerReviewQuestionSetList
                questionSets={questionSets}
                onQuestionSetUpdate={this.handleQuestionSetUpdate}
                initialIds={initialIds}
              />
            )}
          </section>
        </div>
      </div>
    )
  }
}

PeerReviewQuestionsPage.propTypes = {
  questionSets: PropTypes.arrayOf(peerReviewQuestionSetShape),
  history: PropTypes.any,
  setError: PropTypes.func,
  setSuccess: PropTypes.func,
  fetchPeerReviewQuestionSets: PropTypes.func,
  updatePeerReviewQuestionSet: PropTypes.func,
}

const mapStateToProps = (state) => ({
  questionSets: state.peerReviewQuestionsPage.questionSets,
})

const mapDispatchToProps = {
  fetchPeerReviewQuestionSets,
  updatePeerReviewQuestionSet,
  setError,
  setSuccess,
}

const ConnectedPeerReviewQuestionsPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PeerReviewQuestionsPage)

export default withRouter(ConnectedPeerReviewQuestionsPage)
