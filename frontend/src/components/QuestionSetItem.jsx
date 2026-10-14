import React, { useState } from 'react'
import PropTypes from 'prop-types'

import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import EditIcon from '@mui/icons-material/Edit'
import { useTheme } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import './QuestionSetItem.css'

const ItemControls = ({ onEditClicked }) => (
  <Button
    className="question-set-item-controls__edit-button"
    variant="outlined"
    size="small"
    startIcon={<EditIcon />}
    onClick={onEditClicked}
  >
    Edit
  </Button>
)

ItemControls.propTypes = {
  onEditClicked: PropTypes.func,
}

const QuestionSetItem = ({
  title,
  children,
  onEditClicked,
  collapsible = false,
  initiallyExpanded = false,
}) => {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(!collapsible || initiallyExpanded)
  const headerStyle = {
    borderColor: theme.palette.primary.main,
  }

  const toggleExpanded = () => setExpanded(!expanded)

  return (
    <div className="question-set-item">
      <Paper elevation={2} className="question-set-item__header" style={headerStyle}>
        {collapsible ? (
          <h3 className="question-set-item__title question-set-item__title--collapsible">
            <button
              type="button"
              className="question-set-item__toggle"
              aria-expanded={expanded}
              onClick={toggleExpanded}
            >
              <ExpandMoreIcon
                className={`question-set-item__toggle-icon${expanded ? ' question-set-item__toggle-icon--expanded' : ''}`}
              />
              {title}
            </button>
          </h3>
        ) : (
          <h3 className="question-set-item__title">{title}</h3>
        )}
        <div className="question-set-item__controls">
          <ItemControls onEditClicked={onEditClicked} />
        </div>
      </Paper>
      {expanded && (
        <div className="question-set-item__content">
          <Paper elevation={1}>{children}</Paper>
        </div>
      )}
    </div>
  )
}

QuestionSetItem.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
  onEditClicked: PropTypes.func,
  collapsible: PropTypes.bool,
  initiallyExpanded: PropTypes.bool,
}

export default QuestionSetItem
