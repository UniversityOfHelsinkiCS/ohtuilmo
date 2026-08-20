import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom'

import './App.css'

// Components
import ConfigurationPage from './components/ConfigurationPage'
import LandingPage from './components/LandingPage'
import TopicFormPage from './components/TopicFormPage'
import TopicListPage from './components/TopicListPage'
import ViewTopicPage from './components/ViewTopicPage'
import RegistrationPage from './components/RegistrationPage'
import ParticipantsPage from './components/ParticipantsPage'
import NavigationBar from './components/common/NavigationBar'
import Notification from './components/common/Notification'
import LoadingSpinner from './components/common/LoadingSpinner'
import RegistrationQuestionsPage from './components/RegistrationQuestionsPage'
import PeerReviewQuestionsPage from './components/PeerReviewQuestionsPage'
import CustomerReviewQuestionsPage from './components/CustomerReviewQuestionsPage'
import RegistrationManagementPage from './components/RegistrationManagementPage'
import RegistrationDetailsPage from './components/RegistrationDetailsPage'
import GroupManagementPage from './components/GroupManagementPage'
import PeerReviewPage from './components/PeerReviewPage'
import EmailTemplatesPage from './components/EmailTemplatesPage'
import InstructorPage from './components/InstructorPage/InstructorPage'
import CustomerReviewPage from './components/CustomerReviewPage'
import InstructorReviewPage from './components/InstructorReviewPage'
import ViewCustomerReviewsPage from './components/ViewCustomerReviewsPage'
import Registrations from './components/Registrations'
import InstructorReviews from './components/InstructorReviews'
import ViewUsersPage from './components/ViewUsersPage/ViewUsersPage'
import TimeLogsPage from './components/TimeLogsPage/TimeLogsPage'
import InstructorTimeLogsPage from './components/TimeLogsPage/InstructorTimeLogsPage'
import SprintsDashboard from './components/SprintsPage/SprintsDashboard'
import TagsDashboard from './components/TagManagementPage/TagsDashboard'
import AdminSprintsPage from './components/AdminSprintsPage/AdminSprintsPage'
import StudentTagPage from './components/TagPage/StudentTagPage'
import StaffTagPage from './components/TagPage/StaffTagPage'

// Actions
import appActions from './reducers/actions/appActions'
import * as notificationActions from './reducers/actions/notificationActions'
import loginPageActions from './reducers/actions/loginPageActions'
import configurationPageActions from './reducers/actions/configurationPageActions'
import registrationmanagementActions from './reducers/actions/registrationManagementActions'
import registrationActions from './reducers/actions/registrationActions'
import peerReviewPageActions from './reducers/actions/peerReviewPageActions'
import * as userActions from './reducers/actions/userActions'
import myGroupActions from './reducers/actions/myGroupActions'

// Protected routes
import { AdminRoute, LoginRoute, InstructorRoute } from './utils/protectedRoutes'

import loginService from './services/login'

const NotFound = () => (
  <div className="not-found-page">
    <h1>Page not found</h1>
    <Link data-cy="return-link" to="/">
      Return to the home page
    </Link>
  </div>
)

const App = (props) => {
  const {
    updateIsLoading,
    loginUser,
    fetchRegistrationManagement,
    setError,
    logoutUser,
    clearRegistrations,
    isLoading,
    user,
    initializeMyGroup,
  } = props

  useEffect(() => {
    // NODE_ENV
    console.log('MODE:', import.meta.env.MODE)
  }, [])

  useEffect(() => {
    const isCustomerReviewPage = window.location.href.includes('customer-review/')
    const fetchRegistrationManagementData = async () => {
      try {
        await fetchRegistrationManagement()
      } catch (e) {
        console.error('error happened', e)
        setError('Error fetching registration management configuration', 5000)
      }
    }

    const handleGroupInit = async () => {
      try {
        await initializeMyGroup()
      } catch (err) {
        console.error(err)
      }
    }

    const handleLogin = async () => {
      try {
        await loginUser()
      } catch (err) {
        console.error(err)
      }
    }

    const fetchData = async () => {
      updateIsLoading(true)
      if (!isCustomerReviewPage) await handleLogin()
      if (user) await handleGroupInit()
      await fetchRegistrationManagementData()
      updateIsLoading(false)
    }

    fetchData()

    const loginInterval = setInterval(async () => {
      if (!isCustomerReviewPage) {
        try {
          // This has to be the service login and not await loginUser(), because
          // loginUser updates redux state which forces a reload => breaks things!
          await loginService.login()
        } catch (err) {
          console.error(err)
        }
      }
    }, 60 * 1000)

    return () => clearInterval(loginInterval)
  }, [fetchRegistrationManagement, loginUser, setError, updateIsLoading, initializeMyGroup])

  const logout = () => {
    updateIsLoading(true)
    logoutUser()
    clearRegistrations()
    updateIsLoading(false)
  }

  const renderWithLoadingCheck = (component) => (isLoading ? <LoadingSpinner /> : component)

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <div id="app-wrapper">
        <NavigationBar logout={logout} />
        <Notification />
        <div id="app-content">
          <Routes>
            <Route path="/login" element={renderWithLoadingCheck(null)} />
            <Route
              path="/"
              element={<LoginRoute render={() => renderWithLoadingCheck(<LandingPage />)} />}
            />
            <Route
              path="/topics"
              element={<AdminRoute render={() => renderWithLoadingCheck(<TopicListPage />)} />}
            />
            <Route path="/topics/create" element={renderWithLoadingCheck(<TopicFormPage />)} />
            <Route
              path="/topics/:id"
              element={renderWithLoadingCheck(<ViewTopicPage {...props} />)}
            />
            <Route
              path="/administration/configuration"
              element={<AdminRoute render={() => renderWithLoadingCheck(<ConfigurationPage />)} />}
            />
            <Route
              path="/administration/participants"
              element={<AdminRoute render={() => renderWithLoadingCheck(<ParticipantsPage />)} />}
            />
            <Route
              path="/administration/users"
              element={<AdminRoute render={() => renderWithLoadingCheck(<ViewUsersPage />)} />}
            />
            <Route
              path="/administration/customer-review-questions"
              element={
                <AdminRoute
                  render={() => renderWithLoadingCheck(<CustomerReviewQuestionsPage />)}
                />
              }
            />
            <Route
              path="/administration/peer-review-questions"
              element={
                <AdminRoute render={() => renderWithLoadingCheck(<PeerReviewQuestionsPage />)} />
              }
            />
            <Route
              path="/administration/registration-questions"
              element={
                <AdminRoute render={() => renderWithLoadingCheck(<RegistrationQuestionsPage />)} />
              }
            />
            <Route
              path="/administration/groups"
              element={
                <AdminRoute render={() => renderWithLoadingCheck(<GroupManagementPage />)} />
              }
            />
            <Route
              path="/administration/email-templates"
              element={<AdminRoute render={() => renderWithLoadingCheck(<EmailTemplatesPage />)} />}
            />
            <Route
              path="/administration/registrations"
              element={<AdminRoute render={() => renderWithLoadingCheck(<Registrations />)} />}
            />
            <Route
              path="/administration/reviews"
              element={<AdminRoute render={() => renderWithLoadingCheck(<InstructorReviews />)} />}
            />
            <Route
              path="/administration/tags"
              element={<AdminRoute render={() => renderWithLoadingCheck(<TagsDashboard />)} />}
            />
            <Route
              path="/administration/sprints"
              element={<AdminRoute render={() => renderWithLoadingCheck(<AdminSprintsPage />)} />}
            />
            <Route
              path="/customer-review/:id"
              element={renderWithLoadingCheck(<CustomerReviewPage {...props} />)}
            />
            <Route
              path="/register"
              element={
                <LoginRoute
                  user={user}
                  render={() => renderWithLoadingCheck(<RegistrationPage />)}
                />
              }
            />
            <Route
              path="/peerreview"
              element={
                <LoginRoute user={user} render={() => renderWithLoadingCheck(<PeerReviewPage />)} />
              }
            />
            <Route
              path="/administration/registrationmanagement"
              element={
                <AdminRoute render={() => renderWithLoadingCheck(<RegistrationManagementPage />)} />
              }
            />
            <Route
              path="/instructorpage"
              element={
                <InstructorRoute render={() => renderWithLoadingCheck(<InstructorPage />)} />
              }
            />
            <Route
              path="/instructorreviewpage"
              element={
                <InstructorRoute render={() => renderWithLoadingCheck(<InstructorReviewPage />)} />
              }
            />
            <Route
              path="/adminstration/customer-reviews"
              element={
                <InstructorRoute
                  render={() => renderWithLoadingCheck(<ViewCustomerReviewsPage />)}
                />
              }
            />
            <Route
              path="/instructor-timelogs"
              element={
                <InstructorRoute
                  render={() => renderWithLoadingCheck(<InstructorTimeLogsPage />)}
                />
              }
            />
            <Route
              path="/registrationdetails"
              element={
                <LoginRoute render={() => renderWithLoadingCheck(<RegistrationDetailsPage />)} />
              }
            />
            <Route
              path="/timelogs"
              element={<LoginRoute render={() => renderWithLoadingCheck(<TimeLogsPage />)} />}
            />
            <Route
              path="/sprints"
              element={<LoginRoute render={() => renderWithLoadingCheck(<SprintsDashboard />)} />}
            />
            <Route
              path="/student-tags"
              element={<LoginRoute render={() => renderWithLoadingCheck(<StudentTagPage />)} />}
            />
            <Route
              path="/instructor-tags"
              element={<InstructorRoute render={() => renderWithLoadingCheck(<StaffTagPage />)} />}
            />
            <Route
              path="/administration/tags-statistics"
              element={<AdminRoute render={() => renderWithLoadingCheck(<StaffTagPage />)} />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

const mapStateToProps = (state) => {
  return {
    isLoading: state.app.isLoading,
    user: state.login.user,
  }
}

const mapDispatchToProps = {
  setError: notificationActions.setError,
  ...loginPageActions,
  ...appActions,
  fetchConfigurations: configurationPageActions.fetchConfigurations,
  fetchRegistrationManagement: registrationmanagementActions.fetchRegistrationManagement,
  clearRegistrations: registrationActions.clearRegistrations,
  ...peerReviewPageActions,
  logoutUser: userActions.logoutUser,
  loginUser: userActions.loginUser,
  initializeMyGroup: myGroupActions.initializeMyGroup,
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
