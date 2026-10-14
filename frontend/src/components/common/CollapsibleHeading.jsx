import React from 'react'
import PropTypes from 'prop-types'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import './CollapsibleHeading.css'

// a section heading that opens and closes the section below it
const CollapsibleHeading = ({ title, open, onToggle, toggleClassName = '' }) => (
  <h2 className="collapsible-heading">
    <button
      type="button"
      className={`collapsible-heading__toggle ${toggleClassName}`}
      aria-expanded={open}
      onClick={onToggle}
    >
      <ExpandMoreIcon
        className={`collapsible-heading__icon${open ? ' collapsible-heading__icon--open' : ''}`}
      />
      {title}
    </button>
  </h2>
)

CollapsibleHeading.propTypes = {
  title: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  toggleClassName: PropTypes.string,
}

export default CollapsibleHeading
