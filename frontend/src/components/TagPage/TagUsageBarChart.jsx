import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useTheme } from '@mui/material/styles'

const TagUsageBarChart = ({ allTags, selectedTags, tagData, tagColors }) => {
  const theme = useTheme()

  const data = allTags
    .filter((tag) => selectedTags.includes(tag))
    .map((tag) => {
      const totalHours = tagData[tag]?.reduce((sum, sprint) => sum + sprint.minutes / 60, 0) ?? 0

      return {
        name: tag,
        value: totalHours,
      }
    })

  return (
    <ResponsiveContainer width="100%" aspect={2} style={{ maxWidth: 800 }}>
      <BarChart responsive data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          interval={0}
          height={80}
          tick={{ fill: theme.palette.text.primary }}
          tickLine={{ stroke: theme.custom.chartAxis.stroke }}
          axisLine={{ stroke: theme.custom.chartAxis.stroke, strokeWidth: 1 }}
          tickFormatter={(value) => (value.length > 10 ? `${value.substring(0, 10)}...` : value)}
        />
        <YAxis
          label={{
            value: 'Hours',
            angle: -90,
            position: 'insideLeft',
            fill: theme.palette.text.primary,
          }}
          tick={{ fill: theme.custom.chartAxis.stroke }}
          tickLine={{ stroke: theme.custom.chartAxis.stroke }}
          axisLine={{ stroke: theme.custom.chartAxis.stroke, strokeWidth: 1 }}
        />
        <Tooltip
          formatter={(value) => `${Math.round(value * 100) / 100} h`}
          cursor={{ fill: '#4d4d4d', fillOpacity: 0.2 }}
          contentStyle={{ backgroundColor: theme.custom.chartTooltip.background }}
          itemStyle={{ color: theme.palette.text }}
        />
        <Bar dataKey="value">
          {data.map((entry) => (
            <Cell
              key={`cell-${entry.name}`}
              fill={tagColors[entry.name]}
              id={`bar-${entry.name}`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default TagUsageBarChart
