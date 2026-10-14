import { withRouter } from '../../utils/withRouter'
import React, { Fragment, useContext } from 'react'
import { connect } from 'react-redux'

import { updateRole } from '../../services/dev'
import * as userActions from '../../reducers/actions/userActions'
import myGroupActions from '../../reducers/actions/myGroupActions'
import registrationmanagementActions from '../../reducers/actions/registrationManagementActions'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import AccountCircle from '@mui/icons-material/AccountCircle'
import GroupIcon from '@mui/icons-material/Group'
import Brightness4RoundedIcon from '@mui/icons-material/Brightness4Rounded'
import Brightness7RoundedIcon from '@mui/icons-material/Brightness7Rounded'
import NavigationMenu from './NavigationMenu'
import {
  regularItems,
  loggedInItems,
  adminMenuSections,
  instructorItems,
  loggedInUnregisteredItems,
} from './MenuItemLists'
import './NavigationBar.css'
import { ColorModeContext } from '../../context/ColorModeContext'

const NavigationBar = ({
  group,
  user,
  loginUser,
  initializeMyGroup,
  fetchRegistrationManagement,
  history,
  logout,
}) => {
  const { mode: theme, setMode: setTheme } = useContext(ColorModeContext)
  const getAppropriateMenuItemList = () => {
    if (user === null) {
      return { items: regularItems(history) }
    }

    if (user.user.admin) {
      return {
        items: adminMenuSections(history),
      }
    } else if (user.user.instructor) {
      return {
        items: [
          { title: 'Instructor', items: instructorItems(history) },
          { title: 'Student', items: loggedInItems(history) },
          { title: 'Student - no group', items: loggedInUnregisteredItems(history) },
        ],
      }
    } else if (group) {
      return {
        items: [{ title: 'Student', items: loggedInItems(history) }],
      }
    } else {
      return [{ title: 'Student - no group', items: loggedInUnregisteredItems(history) }]
    }
  }

  let groupname =
    group && group.groupName ? (
      <h4
        className="navigation-bar-groupname tracking-in-expand"
        data-cy="groupname_display_assigned"
      >
        {group.groupName}
      </h4>
    ) : (
      <h4
        className="navigation-bar-groupname tracking-in-expand"
        data-cy="groupname_display_unassigned"
      >
        No group assigned
      </h4>
    )
  let username =
    user && user.user ? (
      <h4 className="navigation-bar-username tracking-in-expand">{user.user.username}</h4>
    ) : (
      ''
    )

  let loggedIn =
    user && user.user ? (
      <Fragment>
        {!user.user.admin && !user.user.instructor ? (
          <GroupIcon className="navigation-bar-groupicon" />
        ) : (
          ''
        )}
        {!user.user.admin && !user.user.instructor ? groupname : ''}
        <AccountCircle />
        {username}
      </Fragment>
    ) : (
      ''
    )

  const handleClick = async (role) => {
    try {
      console.log('New role:', await updateRole(role))
      await loginUser()
      await initializeMyGroup()
      await fetchRegistrationManagement()
    } catch (e) {
      console.error('Failed to update role:', e)
    }
  }

  // the role of the logged in test user is shown as the selected button
  const currentRole = user
    ? user.user.admin
      ? 'admin'
      : user.user.instructor
        ? 'instructor'
        : 'student'
    : null

  const roleButton = (role, label) => {
    const selected = role === currentRole
    return (
      <Button
        variant={selected ? 'contained' : 'outlined'}
        aria-pressed={selected}
        style={{
          color: '#323232',
          borderColor: '#c2a628',
          backgroundColor: selected ? '#c2a628' : undefined,
          fontWeight: selected ? 600 : undefined,
        }}
        onClick={async () => await handleClick(role)}
      >
        {label}
      </Button>
    )
  }

  let select_role =
    import.meta.env.MODE === 'development' ? (
      <div style={{ marginRight: '10px' }}>
        {roleButton('student', 'Student')}
        {roleButton('instructor', 'Instructor')}
        {roleButton('admin', 'Admin')}
      </div>
    ) : (
      ''
    )

  const switchTheme = (theme) => {
    setTheme(theme)
    localStorage.setItem('theme', theme)
  }

  const ThemeSelection = () => (
    <Button
      variant="outlined"
      style={{ color: '#323232', marginLeft: '5px', borderColor: '#c2a628' }}
      onClick={() => switchTheme(theme === 'dark' ? 'light' : 'dark')}
      data-cy="theme-toggle"
    >
      {theme === 'dark' ? <Brightness7RoundedIcon /> : <Brightness4RoundedIcon />}
      Theme
    </Button>
  )

  return (
    <div className="navigation-bar-container">
      <AppBar position="static">
        <Toolbar style={{ zIndex: 1500 }}>
          <NavigationMenu
            menuItems={getAppropriateMenuItemList()}
            sectioned={Boolean(user?.user.admin)}
          />
          <Typography
            variant="h6"
            color="inherit"
            className="navigation-bar-title"
            style={{ marginLeft: '9px' }}
          >
            Software engineering project
          </Typography>
          {select_role}
          {loggedIn}
          <ThemeSelection />
          <Button
            className="navigation-bar-logout-button"
            style={{ marginLeft: '10px', color: '#323232', borderColor: '#c2a628' }}
            variant="outlined"
            onClick={logout}
          >
            Log out
          </Button>
        </Toolbar>
      </AppBar>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    user: state.login.user,
    group: state.registrationDetails.myGroup,
  }
}

const mapDispatchToProps = {
  loginUser: userActions.loginUser,
  initializeMyGroup: myGroupActions.initializeMyGroup,
  fetchRegistrationManagement: registrationmanagementActions.fetchRegistrationManagement,
}

const ConnectedNavigationBar = connect(mapStateToProps, mapDispatchToProps)(NavigationBar)

export default withRouter(ConnectedNavigationBar)
