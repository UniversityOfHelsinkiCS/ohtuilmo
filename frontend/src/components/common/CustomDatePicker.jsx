import { DatePicker, DesktopDatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import PropTypes from 'prop-types'

export const CustomDatePicker = ({
  value,
  onChange,
  label,
  className,
  id,
  error,
  helperText,
  disabled,
}) => {
  const Picker = typeof window !== 'undefined' && window.Cypress ? DesktopDatePicker : DatePicker

  return (
    <Picker
      disabled={disabled}
      label={label}
      value={value ? dayjs(value) : null}
      onChange={(newValue) => onChange(newValue ? newValue.format('YYYY-MM-DD') : '')}
      format="DD.MM.YYYY"
      slotProps={{
        textField: {
          id: id,
          className: className,
          variant: 'outlined',
          'aria-describedby': id,
          error: error,
          helperText: helperText,
        },
      }}
    />
  )
}

CustomDatePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
}
