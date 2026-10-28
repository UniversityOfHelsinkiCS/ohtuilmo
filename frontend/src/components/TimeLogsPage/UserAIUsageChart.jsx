import { useSelector } from 'react-redux'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts'
import { useTheme } from '@mui/material/styles'
// TODO: move these to utils or alike, now used in multiple places
const barColourSet = [
  '#9258c8',
  '#3a75c4',
  '#8c0032',
  '#15bef0',
  '#00b08c',
  '#fca311',
  '#009e60',
  '#e5053a',
  '#5bbf21',
  '#00a39a',
  '#e63375',
  '#256ec7',
  '#e95c55',
  '#a3af07',
]
const modelNames = {
  claude: 'Claude Code',
  curreChat: 'CurreChat',
  cursor: 'Cursor',
  copilot: 'GitHub Copilot',
  codex: 'OpenAI Codex',
  other: 'Muita malleja',
}

export const UserAIUsageChart = ({ selectedSprint, groupId, allSprints }) => {
  const theme = useTheme()
  const selected = allSprints.filter((sprint) => sprint.sprint === selectedSprint)[0]
  const aiStatistics = useSelector((state) => state.userAIUsage?.answersTeacher)?.filter(
    (stats) => stats.sprintId === selected?.id.toString(),
  )[0]
  if (!aiStatistics || !groupId) return null
  const dataModelsUsed = Object.keys(aiStatistics.modelsUsedNumbers).map((key) => {
    return {
      name: modelNames[key],
      value: aiStatistics.modelsUsedNumbers[key],
    }
  })

  const dataHowUsed = Object.keys(aiStatistics.howUsedNumbers).map((key) => {
    return {
      name: key,
      generate: aiStatistics.howUsedNumbers[key]['generate'],
      consult: aiStatistics.howUsedNumbers[key]['consult'],
    }
  })
  return (
    <>
      <ResponsiveContainer width="100%" aspect={2} style={{ maxWidth: 800, minHeight: 800 }}>
        <BarChart responsive data={dataModelsUsed} tyle={{ maxWidth: 800, minHeight: 800 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            interval={0}
            height={90}
            axisLine={{ stroke: theme.custom.chartAxis.stroke, strokeWidth: 1 }}
            tickFormatter={(value) => value}
          />
          <YAxis
            label={{
              value: 'Times used',
              angle: -90,
              position: 'insideLeft',
              fill: theme.palette.text.primary,
            }}

            axisLine={{ stroke: theme.custom.chartAxis.stroke, strokeWidth: 2 }}
          />
          <Tooltip
            formatter={(value) => `${value}`}
            cursor={{ fill: '#4d4d4d', fillOpacity: 0.2 }}
            contentStyle={{ backgroundColor: theme.custom.chartTooltip.background }}
            itemStyle={{ color: theme.palette.text }}
          />
          <Bar background={false} dataKey="value">
            <LabelList dataKey="defaultLabel" position="top" />
            {dataModelsUsed.map((_entry, index) => {
              const paceColor = barColourSet[index]
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={barColourSet[index]}
                  stroke={paceColor}
                  strokeWidth={1}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" aspect={2} style={{ maxWidth: 800, minHeight: 800 }}>
        <BarChart responsive data={dataHowUsed} tyle={{ maxWidth: 800, minHeight: 800 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            interval={0}
            height={90}
            axisLine={{ stroke: theme.custom.chartAxis.stroke, strokeWidth: 1 }}
            tickFormatter={(value) => value}
          />
          <YAxis
            label={{
              value: 'Times used',
              angle: -90,
              position: 'insideLeft',
              fill: theme.palette.text.primary,
            }}

            axisLine={{ stroke: theme.custom.chartAxis.stroke, strokeWidth: 2 }}
          />
          <Tooltip
            formatter={(value) => `${value}`}
            cursor={{ fill: '#4d4d4d', fillOpacity: 0.2 }}
            contentStyle={{ backgroundColor: theme.custom.chartTooltip.background }}
            itemStyle={{ color: theme.palette.text }}
          />
          <Bar background={false} dataKey="generate">
            <LabelList dataKey="generate" position="top" />
            {dataHowUsed.map((_entry, index) => {
              const paceColor = barColourSet[index]
              return (
                <Cell key={`cell-${index}`} fill={paceColor} stroke={paceColor} strokeWidth={1} />
              )
            })}
          </Bar>
          <Bar background={false} dataKey="consult">
            <LabelList dataKey="consult" position="top" />
            {dataHowUsed.map((_entry, index) => {
              const paceColor = barColourSet[index]
              return (
                <Cell key={`cell-${index}`} fill={paceColor} stroke={paceColor} strokeWidth={1} />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}
