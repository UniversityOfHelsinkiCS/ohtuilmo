import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

const mapStateToProps = (state) => {
  return {
    user: state.login.user,
  }
}

const Unauthorized = () => (
  <div className="unauthorized-page">
    <h1>Unauthorized.</h1>
    <Link data-cy="return-link" to="/">
      Return to the home page
    </Link>
  </div>
)

export const AdminRoute = connect(mapStateToProps)(({ render, user }) => {
  if (user) {
    return user.user.admin ? render() : <Unauthorized />
  }
  return null
})

export const InstructorRoute = connect(mapStateToProps)(({ render, user }) => {
  if (user) {
    return user.user.instructor || user.user.admin ? render() : <Unauthorized />
  }
  return null
})

export const LoginRoute = connect(mapStateToProps)(({ render, user }) => {
  return user ? render() : null
})
