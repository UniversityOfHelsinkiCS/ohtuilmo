import React, { useState } from 'react'
import PropTypes from 'prop-types'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import './TablePreviewToggle.css'

// shows a question set either as a table or as a preview of the form
const TablePreviewToggle = ({ table, preview }) => {
  const [view, setView] = useState('table')

  return (
    <div>
      <div className="table-preview-toggle">
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_event, newView) => newView && setView(newView)}
        >
          <ToggleButton value="table">Table</ToggleButton>
          <ToggleButton value="preview">Preview</ToggleButton>
        </ToggleButtonGroup>
      </div>
      {view === 'preview' ? preview : table}
    </div>
  )
}

TablePreviewToggle.propTypes = {
  table: PropTypes.node,
  preview: PropTypes.node,
}

export default TablePreviewToggle
