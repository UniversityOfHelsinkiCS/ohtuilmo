import { withRouter } from '../utils/withRouter'
import React, { useState, useEffect, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

import Button from '@mui/material/Button'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import { Table, TableBody, TableRow, TableCell, TableHead, useTheme } from '@mui/material'
import Icon from '@mui/icons-material/Input'

import { ThemeProvider, createTheme } from '@mui/material/styles'
import { green, red, orange } from '@mui/material/colors'

import emailService from '../services/email'
import { formatDate } from '../utils/functions'
import topicListPageActions from '../reducers/actions/topicListPageActions'
import * as notificationActions from '../reducers/actions/notificationActions'
import configurationPageActions from '../reducers/actions/configurationPageActions'

import LoadingCover from './common/LoadingCover'
import './TopicListPage.css'
import { NoneAvailable } from './common/Placeholders'
import configurationMapper from '../utils/configurationMapper'

const redGreenTheme = createTheme({
  palette: {
    primary: green,
    secondary: red,
  },
  typography: {
    useNextVariants: true,
  },
})

const orangeTheme = createTheme({
  palette: {
    primary: orange,
    secondary: orange,
  },
  typography: {
    useNextVariants: true,
  },
})

const ThemedButton = ({ theme, ...props }) => (
  <ThemeProvider theme={theme}>
    <Button {...props} />
  </ThemeProvider>
)

const GreenButton = (props) => <ThemedButton {...props} theme={redGreenTheme} color="primary" />
const RedButton = (props) => <ThemedButton {...props} theme={redGreenTheme} color="secondary" />
const OrangeButton = (props) => <ThemedButton {...props} theme={orangeTheme} color="primary" />

const FinnishFlag = (props) => <img alt="Flag of Finland" {...props} src={'/img/fi.svg'} />

const BritishFlag = (props) => <img alt="Flag of Great Britain" {...props} src={'/img/gb.svg'} />

const AcceptButton = (props) => (
  <GreenButton
    {...props}
    style={{
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    }}
    variant="outlined"
    size="small"
  />
)

const RejectButton = (props) => (
  <RedButton
    {...props}
    style={{
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    }}
    variant="outlined"
    size="small"
  />
)

const CustomerReviewEmailButton = ({ text, onSendRequested }) => {
  const [clickedButtonEl, setClickedButtonEl] = useState(null)
  const isMenuOpen = Boolean(clickedButtonEl)

  const handleButtonClick = (e) => {
    // use currentTarget instead of target because the click
    // will otherwise most likely register the <span> inside the button
    setClickedButtonEl(e.currentTarget)
  }

  const handleMenuClose = () => {
    setClickedButtonEl(null)
  }

  const createHandleLanguageClicked = (messageLanguage) => () => {
    // get value before setting the element null (closing the menu)
    const messageType = clickedButtonEl.value
    handleMenuClose()
    // call callback only after closing menu
    onSendRequested({ messageType, messageLanguage })
  }

  return (
    <>
      <OrangeButton
        data-cy="send-customer-review-link-email"
        value="customerReviewLink"
        variant="outlined"
        size="small"
        onClick={handleButtonClick}
      >
        {text}
      </OrangeButton>

      <Menu
        data-cy="email-language-menu"
        anchorEl={clickedButtonEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem disabled>Choose email language</MenuItem>
        <MenuItem data-cy-send-mail-lang="finnish" onClick={createHandleLanguageClicked('finnish')}>
          <ListItemIcon>
            <FinnishFlag width="16px" />
          </ListItemIcon>
          <ListItemText>Finnish</ListItemText>
        </MenuItem>
        <MenuItem data-cy-send-mail-lang="english" onClick={createHandleLanguageClicked('english')}>
          <ListItemIcon>
            <BritishFlag width="16px" />
          </ListItemIcon>
          <ListItemText>English</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

/**
 * @typedef {{ messageType: string, messageLanguage: string }} EmailInfo
 * @param {{ onSendRequested: (info: EmailInfo) => void, acceptText?: string, rejectText?: string }} props
 */
const AcceptRejectEmailButtons = ({
  acceptText = 'Accept',
  rejectText = 'Reject',
  onSendRequested,
}) => {
  const [clickedButtonEl, setClickedButtonEl] = useState(null)
  const isMenuOpen = Boolean(clickedButtonEl)

  const handleButtonClick = (e) => {
    // use currentTarget instead of target because the click
    // will otherwise most likely register the <span> inside the button
    setClickedButtonEl(e.currentTarget)
  }

  const handleMenuClose = () => {
    setClickedButtonEl(null)
  }

  const createHandleLanguageClicked = (messageLanguage) => () => {
    // get value before setting the element null (closing the menu)
    const messageType = clickedButtonEl.value
    handleMenuClose()
    // call callback only after closing menu
    onSendRequested({ messageType, messageLanguage })
  }

  return (
    <>
      <AcceptButton data-cy="send-accept-mail" value="topicAccepted" onClick={handleButtonClick}>
        {acceptText}
      </AcceptButton>
      <RejectButton data-cy="send-reject-mail" value="topicRejected" onClick={handleButtonClick}>
        {rejectText}
      </RejectButton>

      <Menu
        data-cy="email-language-menu"
        anchorEl={clickedButtonEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem disabled>Choose email language</MenuItem>
        <MenuItem data-cy-send-mail-lang="finnish" onClick={createHandleLanguageClicked('finnish')}>
          <ListItemIcon>
            <FinnishFlag width="16px" />
          </ListItemIcon>
          <ListItemText>Finnish</ListItemText>
        </MenuItem>
        <MenuItem data-cy-send-mail-lang="english" onClick={createHandleLanguageClicked('english')}>
          <ListItemIcon>
            <BritishFlag width="16px" />
          </ListItemIcon>
          <ListItemText>English</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

AcceptRejectEmailButtons.propTypes = {
  onSendRequested: PropTypes.func.isRequired,
  acceptText: PropTypes.string,
  rejectText: PropTypes.string,
}

const TopicDetailsLink = ({ topicId, ...props }) => <Link {...props} to={`/topics/${topicId}`} />

const isTopicAcceptedMail = (sentMail) => sentMail.email.type === 'topicAccepted'
const isTopicRejectedMail = (sentMail) => sentMail.email.type === 'topicRejected'
const isCustomerReviewMail = (sentMail) => sentMail.email.type === 'customerReviewLink'

/**
 * @param {{ topic: any, onEmailSendRequested: (info: EmailInfo) => void, onActiveToggle: () => void }} props
 */
const TopicTableRow = ({ topic, onEmailSendRequested, onActiveToggle }) => {
  const theme = useTheme()
  const hasAcceptMailBeenSent = topic.sentEmails.some(isTopicAcceptedMail)
  const hasRejectMailBeenSent = topic.sentEmails.some(isTopicRejectedMail)
  const hasCustomerReviewMailBeenSent = topic.sentEmails.some(isCustomerReviewMail)

  const isSummer =
    topic.content.summerDates && (topic.content.summerDates.short || topic.content.summerDates.long)

  const className = () => {
    if (hasAcceptMailBeenSent) {
      return 'topic-table-row-accepted'
    } else if (hasRejectMailBeenSent) {
      return 'topic-table-row-rejected'
    }

    return 'topic-table-row'
  }

  const rowBgColor = () => {
    const isDark = theme.palette.type === 'dark'
    const alpha = isDark ? 0.12 : 0.08

    if (hasAcceptMailBeenSent) {
      return { backgroundColor: `rgba(76, 175, 80, ${alpha})` }
    }

    if (hasRejectMailBeenSent) {
      return { backgroundColor: `rgba(244, 67, 54, ${alpha})` }
    }
  }

  return (
    <TableRow
      hover
      className={className()}
      style={rowBgColor()}
      data-cy-topic-name={topic.content.title}
    >
      <TableCell padding="dense">
        <p className="topic-table-row__topic-title">
          <TopicDetailsLink topicId={topic.id}>{topic.content.title}</TopicDetailsLink>
          <Link to={`/topics/${topic.secret_id}`} style={{ padding: 10 }}>
            <Icon />
          </Link>
        </p>
        <p className="topic-table-row__customer">
          {`${topic.content.customerName} (${topic.content.email})`}
        </p>
        <p className="topic-table-row__submit-date">Submitted {formatDate(topic.createdAt)}</p>
        {isSummer && (
          <p>
            Suitable timing: {topic.content.summerDates.short && 'early summer'}{' '}
            {topic.content.summerDates.long && 'whole summer'}
          </p>
        )}
        <p>
          {topic.content.organisation}
          {topic.content.organisation === 'company' && (
            <span style={{ marginLeft: 10 }}>
              Iprights:{' '}
              {topic.content.organisation && topic.content.ipRights
                ? topic.content.ipRights
                : 'Not specified'}
            </span>
          )}
        </p>
      </TableCell>
      <TableCell padding="none">
        {topic.hasReviewed ? (
          'Submitted'
        ) : (
          <CustomerReviewEmailButton
            text={hasCustomerReviewMailBeenSent ? 'Send reminder' : 'Send link'}
            onSendRequested={onEmailSendRequested}
          />
        )}
      </TableCell>
      <TableCell padding="none">
        <AcceptRejectEmailButtons
          acceptText={hasAcceptMailBeenSent ? 'Resend Accept' : 'Accept'}
          rejectText={hasRejectMailBeenSent ? 'Resend Reject' : 'Reject'}
          onSendRequested={onEmailSendRequested}
        />
      </TableCell>
      <TableCell padding="checkbox" align="right">
        <Switch data-cy="toggle-active" checked={topic.active} onClick={onActiveToggle} />
      </TableCell>
    </TableRow>
  )
}

TopicTableRow.propTypes = {
  topic: PropTypes.object.isRequired,
  onEmailSendRequested: PropTypes.func.isRequired,
  onActiveToggle: PropTypes.func.isRequired,
}

const TopicTableHead = () => (
  <TableHead>
    <TableRow hover>
      <TableCell padding="dense">Topic</TableCell>
      <TableCell padding="none">Customer review</TableCell>
      <TableCell padding="none">Send accept/reject email</TableCell>
      <TableCell align="right">Active</TableCell>
    </TableRow>
  </TableHead>
)

/**
 * @typedef {{ topic: any } & EmailInfo} TopicEmailInfo
 * @param {{ topics: any[], onEmailSendRequested: (info: TopicEmailInfo) => void, onActiveToggle: (topic: any) => void }} props
 */
const TopicTable = ({ topics, onEmailSendRequested, onActiveToggle }) => {
  return topics.length > 0 ? (
    <Table>
      <TopicTableHead />
      <TableBody>
        {topics.map((topic) => (
          <TopicTableRow
            key={topic.id}
            topic={topic}
            onEmailSendRequested={(emailInfo) => onEmailSendRequested({ ...emailInfo, topic })}
            onActiveToggle={() => onActiveToggle(topic)}
          />
        ))}
      </TableBody>
    </Table>
  ) : (
    <NoneAvailable />
  )
}

TopicTable.propTypes = {
  topics: PropTypes.array,
  onEmailSendRequested: PropTypes.func.isRequired,
  onActiveToggle: PropTypes.func.isRequired,
}

const activeFirstThenByTitle = (topicA, topicB) => {
  if (topicA.active === topicB.active) {
    return `${topicA.content.title}`.localeCompare(`${topicB.content.title}`)
  }
  return +topicB.active - +topicA.active
}

const isAxiosError = (e) => !!e.response

const getApiError = (e) => {
  return isAxiosError(e) && e.response.data && e.response.data.error
}

const TopicAcceptanceFilter = (props) => {
  const { acceptanceFilter, updateAcceptanceFilter } = props

  const handleAcceptanceFilterChange = (event) => {
    updateAcceptanceFilter(event.target.value)
  }

  return (
    <Fragment>
      <FormControl sx={{ margin: '0 4rem' }}>
        <ThemeProvider theme={redGreenTheme}>
          <RadioGroup
            row
            defaultValue="all"
            name="topic-acceptance-filter"
            value={acceptanceFilter}
            onChange={handleAcceptanceFilterChange}
          >
            <FormControlLabel
              data-cy="acceptance-filter-all"
              value="all"
              control={<Radio color="default" />}
              label="All"
            />
            <FormControlLabel
              data-cy="acceptance-filter-accepted"
              value="accepted"
              control={<Radio color="primary" />}
              label="Accepted"
            />
            <FormControlLabel
              data-cy="acceptance-filter-rejected"
              value="rejected"
              control={<Radio color="secondary" />}
              label="Rejected"
            />
          </RadioGroup>
        </ThemeProvider>
      </FormControl>
    </Fragment>
  )
}

const TopicListPage = (props) => {
  const {
    acceptanceFilter,
    fetchTopics,
    setError,
    configurations,
    fetchConfigurations,
    updateFilter,
    setTopicActive,
    setSuccess,
    sendCustomerEmail,
    filter,
    topics,
    isLoading,
  } = props

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTopics()
      } catch (err) {
        console.error(err)
        setError('An error occurred while loading data!', 3000)
      }

      if (!configurations.length) await fetchConfigurations()
    }

    fetchData()
  }, [configurations])

  useEffect(() => {
    const updateData = async () => {
      if (configurations.length) await updateFilter(configurations[0].id)
    }

    updateData()
  }, [configurations, updateFilter])

  const handleActiveToggle = async (topic) => {
    try {
      const newActiveState = !topic.active
      await setTopicActive(topic, newActiveState)

      const activeDescription = newActiveState ? 'active' : 'inactive'
      setSuccess(`Topic '${topic.content.title}' has been set ${activeDescription}.`, 3000)
    } catch (err) {
      console.error('error happened', err.response)
      setError('Some error happened', 3000)
    }
  }

  const confirmEmailPreview = async (messageType, messageLanguage, topicId) => {
    try {
      const preview = await emailService.previewCustomerEmail({
        messageType,
        messageLanguage,
        topicId,
      })
      const confirmMessage = [
        'Send the following email?',
        '',
        `Subject: ${preview.subject}`,
        `To: ${preview.to}`,
        '---',
        preview.email,
      ].join('\n')

      return window.confirm(confirmMessage)
    } catch (err) {
      console.error(err)
      if (isAxiosError(err)) {
        console.error(err.response.data)
      }
      const errorMsg = getApiError(err) || 'server error, see console for details'
      setError(`Failed to generate preview. See console for details. Error: ${errorMsg}`, 10000)
      return false
    }
  }

  const handleEmailSendRequested = async ({ topic, messageType, messageLanguage }) => {
    const userConfirmedPreview = await confirmEmailPreview(messageType, messageLanguage, topic.id)

    if (!userConfirmedPreview) {
      return
    }

    try {
      await sendCustomerEmail(topic.id, messageType, messageLanguage)
      setSuccess('Email sent!')
    } catch (err) {
      console.error(err)
      if (isAxiosError(err)) {
        console.error(err.response.data)
      }
      const errorMsg = getApiError(err) || 'server error, see console for details'
      setError(`Failed to send email. See console for details. Error: '${errorMsg}'`, 10000)
    }
  }

  const configurationMenuItems = () => {
    const semesterValues = {
      Spring: 1,
      Summer: 2,
      Autumn: 3,
      Fall: 3,
    }
    const configurationSorting = (a, b) => {
      const aConf = configurationMapper(a.name).split(' ')
      const bConf = configurationMapper(b.name).split(' ')
      const result = bConf[0] - aConf[0]
      if (result !== 0) {
        return result
      } else {
        return semesterValues[bConf[1]] - semesterValues[aConf[1]]
      }
    }
    return []
      .concat(
        <MenuItem value={0} key={0} data-cy="configurations-all">
          All configurations
        </MenuItem>,
      )
      .concat(
        configurations.sort(configurationSorting).map((configuration) => {
          const confName = configurationMapper(configuration.name)
          const splits = confName.split(' ')
          return (
            <MenuItem
              value={configuration.id}
              key={configuration.id}
              data-cy={'configurations-' + splits[0] + '-' + splits[1]}
            >
              {confName}
            </MenuItem>
          )
        }),
      )
  }

  const shownTopics =
    filter === 0
      ? topics
          .filter((topic) =>
            acceptanceFilter === 'accepted'
              ? topic.sentEmails.length > 0 && topic.sentEmails[0].email.type === 'topicAccepted'
              : topic.sentEmails.length > 0 && topic.sentEmails[0].email.type === 'topicRejected',
          )
          .sort(activeFirstThenByTitle)
      : acceptanceFilter === 'all'
        ? topics.filter((topic) => topic.configuration_id === filter).sort(activeFirstThenByTitle)
        : topics
            .filter((topic) => topic.configuration_id === filter)
            .filter((topic) =>
              acceptanceFilter === 'accepted'
                ? topic.sentEmails.length > 0 && topic.sentEmails[0].email.type === 'topicAccepted'
                : topic.sentEmails.length > 0 && topic.sentEmails[0].email.type === 'topicRejected',
            )
            .sort(activeFirstThenByTitle)

  return (
    <div className="topics-container">
      {isLoading && <LoadingCover className="topics-container__loading-cover" />}

      <div className="topics-filter-container">
        <Select
          data-cy="configurations-filter"
          value={filter}
          onChange={(event) => updateFilter(event.target.value)}
        >
          {configurationMenuItems()}
        </Select>

        <TopicAcceptanceFilter {...props} />
      </div>

      {!isLoading && (
        <TopicTable
          topics={shownTopics}
          onEmailSendRequested={handleEmailSendRequested}
          onActiveToggle={handleActiveToggle}
        />
      )}
    </div>
  )
}

TopicListPage.propTypes = {
  filter: PropTypes.number.isRequired,
  topics: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  history: PropTypes.object.isRequired,
  fetchTopics: PropTypes.func.isRequired,
  setTopicActive: PropTypes.func.isRequired,
  updateFilter: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  setSuccess: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => {
  const { topicListPage } = state
  return {
    topics: topicListPage.topics,
    // don't show loading cover for update loadings; active state changes are
    // done in quick succession and their "loading" doesn't affect page usage
    isLoading: topicListPage.isTopicsLoading,
    filter: topicListPage.filter,
    acceptanceFilter: topicListPage.acceptanceFilter,
    configurations: state.configurationPage.configurations,
  }
}

const mapDispatchToProps = {
  fetchTopics: topicListPageActions.fetchTopics,
  updateFilter: topicListPageActions.updateFilter,
  updateAcceptanceFilter: topicListPageActions.updateAcceptanceFilter,
  setTopicActive: topicListPageActions.setTopicActive,
  sendCustomerEmail: topicListPageActions.sendCustomerEmail,
  setError: notificationActions.setError,
  setSuccess: notificationActions.setSuccess,
  fetchConfigurations: configurationPageActions.fetchConfigurations,
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TopicListPage))
