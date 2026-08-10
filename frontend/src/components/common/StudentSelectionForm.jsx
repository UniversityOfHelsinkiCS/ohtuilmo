import React from 'react'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'

export const StudentSelectionForm = ({
  configurations,
  selectedConfigurationId,
  handleConfigurationChange,
  groups,
  selectedGroupId,
  handleGroupChange,
  students,
  selectedStudentNumber,
  handleStudentNumberChange,
}) => {
  const GroupIsInConfiguration = (group, configurationId) => {
    return group.configurationId === configurationId
  }

  const StudentIsInGroup = (student, group_id) => {
    return groups.find((g) => g.id === group_id)?.studentIds.includes(student.student_number)
  }

  return (
    <div>
      <div className="selector-container">
        <div style={{ padding: 20 }}>
          <Typography variant="caption">Select configuration</Typography>
          <Select
            data-cy="configuration-selector"
            value={selectedConfigurationId}
            onChange={(e) => {
              handleConfigurationChange(e.target.value)
              handleGroupChange(0)
              handleStudentNumberChange(0)
            }}
            MenuProps={{ style: { zIndex: 1600 } }}
          >
            <MenuItem key={0} className="configuration-menu-item" value={0} disabled>
              Pick a configuration
            </MenuItem>
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
        </div>

        {selectedConfigurationId !== 0 && (
          <div style={{ padding: 20 }}>
            <Typography variant="caption">Select group</Typography>
            <Select
              data-cy="group-selector"
              value={selectedGroupId}
              onChange={(e) => {
                handleGroupChange(e.target.value)
                handleStudentNumberChange(0)
              }}
              MenuProps={{ style: { zIndex: 1600 } }}
            >
              <MenuItem key={0} className="group-menu-item" value={0} disabled>
                Pick a group
              </MenuItem>
              {groups
                .filter((group) => GroupIsInConfiguration(group, selectedConfigurationId))
                .map((group) => (
                  <MenuItem key={group.id} className="group-menu-item" value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
            </Select>
          </div>
        )}

        {selectedGroupId !== 0 && (
          <div style={{ padding: 20 }}>
            <Typography variant="caption">Select student</Typography>
            <Select
              data-cy="student-selector"
              value={selectedStudentNumber}
              onChange={(e) => {
                handleStudentNumberChange(e.target.value)
              }}
              disabled={!selectedGroupId}
              MenuProps={{ style: { zIndex: 1600 } }}
            >
              <MenuItem key={0} className="student-menu-item" value={0}>
                Pick a student
              </MenuItem>
              {students
                .filter((student) => StudentIsInGroup(student, selectedGroupId))
                .map((student) => (
                  <MenuItem
                    key={student.student_number}
                    className="student-menu-item"
                    value={student.student_number}
                  >
                    {student.first_names} {student.last_name}
                  </MenuItem>
                ))}
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
