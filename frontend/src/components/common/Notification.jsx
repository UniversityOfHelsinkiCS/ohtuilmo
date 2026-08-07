import React from 'react'
import { connect } from 'react-redux'
import Snackbar from '@mui/material/Snackbar'
import SnackbarContent from '@mui/material/SnackbarContent'

import { clearNotifications } from '../../reducers/actions/notificationActions'

const getBackgroundColor = (type) => {
  switch (type) {
    case 'error':
      return 'red'
    case 'success':
      return 'green'
    default:
      return 'skyblue'
  }
}

const Notification = ({ type, message, open, duration, onNotificationClose }) => {
  const style = {
    backgroundColor: getBackgroundColor(type),
  }

  return (
    <div className="notification">
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        open={open}
        autoHideDuration={duration}
        onClose={onNotificationClose}
      >
        <SnackbarContent
          style={style}
          message={<span data-testid="notification-message">{message}</span>}
        />
      </Snackbar>
    </div>
  )
}

const mapStateToProps = (state) => {
  const { notifications } = state
  const { type, open, message, duration } = notifications

  return {
    type,
    open,
    message,
    duration,
  }
}

const mapDispatchToProps = {
  onNotificationClose: clearNotifications,
}

export default connect(mapStateToProps, mapDispatchToProps)(Notification)
