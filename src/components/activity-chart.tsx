import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export function ActivityChart({
  days,
}: {
  days: { date: Date; count: number }[]
}) {
  const chartData = days.map((d) => ({
    day: String(d.date.getDate()).padStart(2, "0"),
    date: d.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    findings: d.count,
  }))
  const max = Math.max(3, ...days.map((d) => d.count))
  return (
    <ChartContainer
      config={{ findings: { label: "Findings", color: "var(--chart-1)" } }}
      className="aspect-auto h-[218px] w-full px-4 pt-5"
      aria-label="Findings discovered per day over the last 14 days"
    >
      <BarChart
        data={chartData}
        accessibilityLayer
        margin={{ left: -23, right: 4, top: 5, bottom: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tick={{ fontSize: 9 }}
          interval={0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          domain={[0, max]}
          ticks={[0, Math.ceil(max / 2), max]}
          allowDecimals={false}
          tick={{ fontSize: 9 }}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.date}
            />
          }
        />
        <Bar
          dataKey="findings"
          fill="var(--color-findings)"
          radius={0}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  )
}
