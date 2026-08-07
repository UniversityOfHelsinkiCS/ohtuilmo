import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Provider } from 'react-redux'
import App from './App'
import store from './reducers/store'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { amber } from '@mui/material/colors'
import { ThemeProvider as LegacyThemeProvider } from '@mui/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ColorModeContext } from './context/ColorModeContext'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fi'

const getInitialMode = () => {
  const stored = localStorage.getItem('theme')
  return stored ? stored : 'light'
}

const Root = () => {
  const [themeMode, setThemeMode] = useState(getInitialMode)
  const isDark = themeMode === 'dark'

  const theme = createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: '#fdd835',
      },
      secondary: amber,
      text: {
        primary: isDark ? '#ffffff' : '#4d4d4d',
      },
    },
    typography: {
      h1: {
        marginTop: '0.67em',
        marginBottom: '0.67em',
      },
      h2: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 3,
      },
      h3: {
        marginTop: '1em',
        marginBottom: '1em',
      },
      h4: {
        marginTop: '1.33em',
        marginBottom: '1.33em',
      },
      h5: {
        marginTop: '1.67em',
        marginBottom: '1.67em',
      },
    },
    custom: {
      chartTooltip: {
        background: isDark ? '#202020' : '#ffffff',
        border: isDark ? '#73292c' : '#d88488',
        shadow: isDark ? '1px 1px 2px #73292c' : '1px 1px 2px #d88488',
      },
      chartAxis: {
        stroke: isDark ? '#ffffff' : '#4d4d4d',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          a: {
            color: isDark ? '#78c3ff' : '',
          },
          'a:visited': {
            color: isDark ? '#b4a0dc' : '',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.02)',
          },
          body: {
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            },
          },
        },
      },
    },
  })

  return (
    <Provider store={store}>
      <ColorModeContext.Provider value={{ mode: themeMode, setMode: setThemeMode }}>
        <ThemeProvider theme={theme}>
          <LegacyThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fi">
              <CssBaseline />
              <App />
            </LocalizationProvider>
          </LegacyThemeProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </Provider>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<Root />)

if (window.Cypress) {
  window.store = store
}
