import React from 'react'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'

export const SprintsSelectForm = ({
  configurations,
  selectedConfigurationId,
  handleConfigurationChange,
  groups,
  selectedGroupId,
  handleGroupChange,
}) => {
  const SelectorWrapper = ({ label, children }) => (
    <div style={{ padding: 20 }}>
      <Typography variant="caption">{label}</Typography>
      {children}
    </div>
  )

  const ConfigurationSelect = ({
    configurations,
    selectedConfigurationId,
    handleConfigurationChange,
    handleGroupChange,
  }) => {
    return (
      <Select
        data-cy="configuration-selector"
        value={selectedConfigurationId}
        onChange={(e) => {
          handleConfigurationChange(e.target.value)
          handleGroupChange('')
        }}
        MenuProps={{ style: { zIndex: 1600 } }}
      >
        {configurations.map((configuration) => (
          <MenuItem
            key={configuration.id}
            className="configuration-menu-item"
            value={configuration.id}
          >
            {configuration.name}
          </MenuItem>
        ))}
      </Select>
    )
  }

  const GroupIsInConfiguration = (group, configurationId) => {
    return group.configurationId === configurationId
  }

  const GroupSelect = ({ groups, selectedGroupId, handleGroupChange }) => {
    return (
      <Select
        data-cy="group-selector"
        value={selectedGroupId}
        onChange={(e) => {
          handleGroupChange(e.target.value)
        }}
        MenuProps={{ style: { zIndex: 1600 } }}
      >
        {groups
          .filter((group) => GroupIsInConfiguration(group, selectedConfigurationId))
          .map((group) => (
            <MenuItem key={group.id} className="group-menu-item" value={group.id}>
              {group.name}
            </MenuItem>
          ))}
      </Select>
    )
  }

  return (
    <div className="timelog-select-container">
      <div className="selector-container">
        <SelectorWrapper label="Select configuration">
          <ConfigurationSelect
            configurations={configurations}
            selectedConfigurationId={selectedConfigurationId}
            handleConfigurationChange={handleConfigurationChange}
            handleGroupChange={handleGroupChange}
          />
        </SelectorWrapper>
        {selectedConfigurationId !== '' && (
          <SelectorWrapper label="Select group">
            <GroupSelect
              selectedGroupId={selectedGroupId}
              handleGroupChange={handleGroupChange}
              groups={groups}
            />
          </SelectorWrapper>
        )}
      </div>
    </div>
  )
}
