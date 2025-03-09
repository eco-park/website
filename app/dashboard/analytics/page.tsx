"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Download } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { createClient } from "@supabase/supabase-js"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// Define chart colors
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  })

  const [timeframe, setTimeframe] = useState("daily")
  const [loading, setLoading] = useState(true)

  // State for chart data
  const [occupancyData, setOccupancyData] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [parkingTypeData, setParkingTypeData] = useState<any[]>([])
  const [peakHoursData, setPeakHoursData] = useState<any[]>([])

  // State for statistics
  const [stats, setStats] = useState({
    averageOccupancy: 0,
    peakOccupancy: 0,
    peakTime: "",
    averageDuration: 0,
    revenueEstimate: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch occupancy data
        const { data: occupancyData, error: occupancyError } = await supabase
          .from("occupancy_stats")
          .select("*")
          .order("time")

        if (occupancyError) throw occupancyError

        // Fetch parking spots data for type distribution
        const { data: spotsData, error: spotsError } = await supabase.from("parking_spots").select("type")

        if (spotsError) throw spotsError

        // Fetch parking events for duration calculation
        const { data: eventsData, error: eventsError } = await supabase
          .from("parking_events")
          .select("*")
          .order("timestamp", { ascending: false })

        if (eventsError) throw eventsError

        // Process occupancy data
        if (occupancyData) {
          // Daily occupancy
          setOccupancyData(
            occupancyData.map((item) => ({
              time: item.time,
              occupancy: item.occupancy_percentage,
            })),
          )

          // Calculate average occupancy
          const avgOccupancy = Math.round(
            occupancyData.reduce((sum, item) => sum + item.occupancy_percentage, 0) / occupancyData.length,
          )

          // Find peak occupancy
          const peakOccupancyData = occupancyData.reduce(
            (max, item) => (item.occupancy_percentage > max.occupancy_percentage ? item : max),
            occupancyData[0],
          )

          // Generate weekly data (simulated from daily data)
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          const weeklyOccupancy = days.map((day, index) => {
            // Simulate weekly data based on day of week patterns
            const baseOccupancy = 50 + Math.round(Math.sin(index * 0.8) * 20) + Math.round(Math.random() * 15)
            return {
              day,
              occupancy: baseOccupancy,
              available: 100 - baseOccupancy,
            }
          })
          setWeeklyData(weeklyOccupancy)

          // Generate monthly data (simulated)
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
          const monthlyOccupancy = months.map((month, index) => {
            // Simulate seasonal patterns
            const baseOccupancy = 55 + Math.round(Math.sin(index * 0.5) * 15) + Math.round(Math.random() * 10)
            return {
              month,
              occupancy: baseOccupancy,
            }
          })
          setMonthlyData(monthlyOccupancy)

          // Generate peak hours data from occupancy data
          const peakHours = [
            { hour: "6-8 AM", value: 0 },
            { hour: "8-10 AM", value: 0 },
            { hour: "10-12 PM", value: 0 },
            { hour: "12-2 PM", value: 0 },
            { hour: "2-4 PM", value: 0 },
            { hour: "4-6 PM", value: 0 },
            { hour: "6-8 PM", value: 0 },
            { hour: "8-10 PM", value: 0 },
          ]

          // Map time slots to peak hours
          occupancyData.forEach((item) => {
            const hour = Number.parseInt(item.time.split(":")[0])
            if (hour >= 6 && hour < 8) peakHours[0].value = Math.max(peakHours[0].value, item.occupancy_percentage)
            else if (hour >= 8 && hour < 10)
              peakHours[1].value = Math.max(peakHours[1].value, item.occupancy_percentage)
            else if (hour >= 10 && hour < 12)
              peakHours[2].value = Math.max(peakHours[2].value, item.occupancy_percentage)
            else if (hour >= 12 && hour < 14)
              peakHours[3].value = Math.max(peakHours[3].value, item.occupancy_percentage)
            else if (hour >= 14 && hour < 16)
              peakHours[4].value = Math.max(peakHours[4].value, item.occupancy_percentage)
            else if (hour >= 16 && hour < 18)
              peakHours[5].value = Math.max(peakHours[5].value, item.occupancy_percentage)
            else if (hour >= 18 && hour < 20)
              peakHours[6].value = Math.max(peakHours[6].value, item.occupancy_percentage)
            else if (hour >= 20 && hour < 22)
              peakHours[7].value = Math.max(peakHours[7].value, item.occupancy_percentage)
          })
          setPeakHoursData(peakHours)

          // Process parking type distribution
          if (spotsData && spotsData.length > 0) {
            const typeCount: Record<string, number> = {}
            spotsData.forEach((spot) => {
              typeCount[spot.type] = (typeCount[spot.type] || 0) + 1
            })

            const typeData = Object.entries(typeCount).map(([name, value]) => ({
              name: name.charAt(0).toUpperCase() + name.slice(1),
              value,
            }))
            setParkingTypeData(
              typeData.length > 0
                ? typeData
                : [
                    { name: "Standard", value: 65 },
                    { name: "Handicap", value: 10 },
                    { name: "Electric", value: 15 },
                    { name: "Compact", value: 10 },
                  ],
            )
          } else {
            // Fallback data if no spots data
            setParkingTypeData([
              { name: "Standard", value: 65 },
              { name: "Handicap", value: 10 },
              { name: "Electric", value: 15 },
              { name: "Compact", value: 10 },
            ])
          }

          // Calculate average duration (simulated)
          const avgDuration = 2.5 + (Math.random() * 0.5 - 0.25) // 2.25 to 2.75 hours

          // Calculate revenue estimate (simulated)
          const hourlyRate = 2.5 // $2.50 per hour
          const totalSpots = spotsData?.length || 120
          const dailyHours = 10 // Average 10 hours of paid parking per day
          const occupancyRate = avgOccupancy / 100
          const dailyRevenue = Math.round(totalSpots * occupancyRate * dailyHours * hourlyRate)
          const weeklyRevenue = dailyRevenue * 7

          // Set statistics
          setStats({
            averageOccupancy: avgOccupancy,
            peakOccupancy: peakOccupancyData.occupancy_percentage,
            peakTime: peakOccupancyData.time,
            averageDuration: avgDuration,
            revenueEstimate: weeklyRevenue,
          })
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        // Use fallback data if database fetch fails
        setOccupancyData([
          { time: "00:00", occupancy: 15 },
          { time: "03:00", occupancy: 10 },
          { time: "06:00", occupancy: 25 },
          { time: "09:00", occupancy: 85 },
          { time: "12:00", occupancy: 70 },
          { time: "15:00", occupancy: 80 },
          { time: "18:00", occupancy: 65 },
          { time: "21:00", occupancy: 30 },
        ])

        setWeeklyData([
          { day: "Mon", occupancy: 65, available: 35 },
          { day: "Tue", occupancy: 70, available: 30 },
          { day: "Wed", occupancy: 75, available: 25 },
          { day: "Thu", occupancy: 80, available: 20 },
          { day: "Fri", occupancy: 85, available: 15 },
          { day: "Sat", occupancy: 60, available: 40 },
          { day: "Sun", occupancy: 45, available: 55 },
        ])

        setMonthlyData([
          { month: "Jan", occupancy: 55 },
          { month: "Feb", occupancy: 60 },
          { month: "Mar", occupancy: 65 },
          { month: "Apr", occupancy: 70 },
          { month: "May", occupancy: 75 },
          { month: "Jun", occupancy: 80 },
          { month: "Jul", occupancy: 85 },
          { month: "Aug", occupancy: 80 },
          { month: "Sep", occupancy: 75 },
          { month: "Oct", occupancy: 70 },
          { month: "Nov", occupancy: 65 },
          { month: "Dec", occupancy: 60 },
        ])

        setParkingTypeData([
          { name: "Standard", value: 65 },
          { name: "Handicap", value: 10 },
          { name: "Electric", value: 15 },
          { name: "Compact", value: 10 },
        ])

        setPeakHoursData([
          { hour: "6-8 AM", value: 65 },
          { hour: "8-10 AM", value: 85 },
          { hour: "10-12 PM", value: 70 },
          { hour: "12-2 PM", value: 65 },
          { hour: "2-4 PM", value: 60 },
          { hour: "4-6 PM", value: 80 },
          { hour: "6-8 PM", value: 55 },
          { hour: "8-10 PM", value: 30 },
        ])

        setStats({
          averageOccupancy: 68,
          peakOccupancy: 85,
          peakTime: "09:00",
          averageDuration: 2.5,
          revenueEstimate: 4250,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, timeframe])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Parking Analytics</h2>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Occupancy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageOccupancy}%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">+2%</span> from last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Peak Occupancy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.peakOccupancy}%</div>
                  <p className="text-xs text-muted-foreground">At {stats.peakTime} on weekdays</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageDuration.toFixed(1)}h</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-red-500">-15min</span> from last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Estimate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.revenueEstimate.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">+$320</span> from last week
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Daily Occupancy</CardTitle>
                  <CardDescription>Parking lot occupancy over 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {loading ? (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">Loading chart data...</p>
                      </div>
                    ) : (
                      <ChartContainer
                        config={{
                          occupancy: {
                            label: "Occupancy",
                            color: "hsl(var(--chart-1))",
                          },
                        }}
                        className="h-full"
                      >
                        <ResponsiveContainer width="99%" height="99%">
                          <LineChart data={occupancyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                            <YAxis unit="%" tick={{ fontSize: 12 }} width={40} />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Line
                              type="monotone"
                              dataKey="occupancy"
                              stroke="var(--color-occupancy)"
                              strokeWidth={2}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Parking Type Distribution</CardTitle>
                  <CardDescription>Distribution by parking spot type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {loading ? (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">Loading chart data...</p>
                      </div>
                    ) : (
                      <ChartContainer
                        config={{
                          Standard: {
                            label: "Standard",
                            color: "hsl(var(--chart-1))",
                          },
                          Handicap: {
                            label: "Handicap",
                            color: "hsl(var(--chart-2))",
                          },
                          Electric: {
                            label: "Electric",
                            color: "hsl(var(--chart-3))",
                          },
                          Compact: {
                            label: "Compact",
                            color: "hsl(var(--chart-4))",
                          },
                        }}
                        className="h-full"
                      >
                        <ResponsiveContainer width="99%" height="99%">
                          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <Pie
                              data={parkingTypeData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {parkingTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}`, "Count"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="occupancy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Occupancy</CardTitle>
                <CardDescription>Parking lot occupancy by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">Loading chart data...</p>
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        occupancy: {
                          label: "Occupied",
                          color: "hsl(var(--chart-1))",
                        },
                        available: {
                          label: "Available",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-full"
                    >
                      <ResponsiveContainer width="99%" height="99%">
                        <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis unit="%" tick={{ fontSize: 12 }} width={40} />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Legend wrapperStyle={{ fontSize: "12px", marginTop: "10px" }} />
                          <Bar dataKey="occupancy" stackId="a" fill="var(--color-occupancy)" />
                          <Bar dataKey="available" stackId="a" fill="var(--color-available)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
                <CardDescription>Busiest hours during the day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">Loading chart data...</p>
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        value: {
                          label: "Occupancy",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-full"
                    >
                      <ResponsiveContainer width="99%" height="99%">
                        <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                          <YAxis unit="%" tick={{ fontSize: 12 }} width={40} />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" fill="var(--color-value)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Occupancy trends over the past year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">Loading chart data...</p>
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        occupancy: {
                          label: "Occupancy",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-full"
                    >
                      <ResponsiveContainer width="99%" height="99%">
                        <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis unit="%" tick={{ fontSize: 12 }} width={40} />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Area
                            type="monotone"
                            dataKey="occupancy"
                            stroke="var(--color-occupancy)"
                            fill="var(--color-occupancy)"
                            fillOpacity={0.2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generated Reports</CardTitle>
                <CardDescription>Download detailed analytics reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Monthly Occupancy Report", date: "March 1, 2025", type: "PDF" },
                    { name: "Weekly Usage Analysis", date: "February 28, 2025", type: "Excel" },
                    { name: "Peak Hours Report", date: "February 25, 2025", type: "PDF" },
                    { name: "Revenue Projection", date: "February 20, 2025", type: "Excel" },
                  ].map((report, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-muted-foreground">{report.date}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        {report.type}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule Reports</CardTitle>
                <CardDescription>Set up automated report generation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reportType">Report Type</Label>
                      <Select defaultValue="occupancy">
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="occupancy">Occupancy Report</SelectItem>
                          <SelectItem value="revenue">Revenue Report</SelectItem>
                          <SelectItem value="usage">Usage Analysis</SelectItem>
                          <SelectItem value="peak">Peak Hours Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select defaultValue="weekly">
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="format">Format</Label>
                      <Select defaultValue="pdf">
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipients">Recipients</Label>
                      <Input id="recipients" placeholder="Email addresses (comma separated)" />
                    </div>
                  </div>
                  <Button>Schedule Report</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

