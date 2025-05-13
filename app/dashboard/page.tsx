"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, BarChart3, Camera, Car } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { CameraStream } from "@/components/camera-stream"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface OccupancyData {
  time: string
  occupancy: number
}

interface ParkingEvent {
  time: string
  event: string
  status: "Occupied" | "Available"
}

interface CameraData {
  id: number
  name: string
  area_id: number
  status: string
  ip_address?: string
  port?: number
  username?: string
  password?: string
  type?: string
  parking_areas?: {
    name: string
  }
}

export default function DashboardPage() {
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([])
  const [recentEvents, setRecentEvents] = useState<ParkingEvent[]>([])
  const [cameras, setCameras] = useState<CameraData[]>([])
  const [stats, setStats] = useState({
    totalSpots: 0,
    availableSpots: 0,
    occupancyRate: 0,
    activeCameras: 0,
  })
  const [loading, setLoading] = useState(true)
  const [camerasLoading, setCamerasLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch occupancy data
        const { data: occupancyData, error: occupancyError } = await supabase
          .from("occupancy_stats")
          .select("*")
          .order("time")
          .limit(8)

        if (occupancyError) throw occupancyError

        // Fetch recent events
        const { data: eventsData, error: eventsError } = await supabase
          .from("parking_events")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(4)

        if (eventsError) throw eventsError

        // Fetch stats
        const { data: areasData, error: areasError } = await supabase.from("parking_areas").select("total_spots")

        if (areasError) throw areasError

        const { data: camerasData, error: camerasError } = await supabase
          .from("cameras")
          .select("*, parking_areas(name)")
          .order("id", { ascending: true })
          .limit(3)

        if (camerasError) throw camerasError

        const { data: spotsData, error: spotsError } = await supabase.from("parking_spots").select("id, status")

        if (spotsError) throw spotsError

        // Process the data
        if (occupancyData) {
          setOccupancyData(
            occupancyData.map((item) => ({
              time: item.time,
              occupancy: item.occupancy_percentage,
            })),
          )
        }

        if (eventsData) {
          setRecentEvents(
            eventsData.map((item) => ({
              time: new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              event: `Spot ${item.spot_id} ${item.event_type.toLowerCase()}`,
              status: item.event_type === "occupied" ? "Occupied" : "Available",
            })),
          )
        }

        // Calculate stats
        if (areasData && camerasData && spotsData) {
          const totalSpots = areasData.reduce((sum, area) => sum + area.total_spots, 0)
          const availableSpots = spotsData.filter((spot) => spot.status === "available").length
          const occupancyRate = totalSpots > 0 ? Math.round(((totalSpots - availableSpots) / totalSpots) * 100) : 0
          const activeCameras = camerasData.filter((camera) => camera.status === "online").length

          setStats({
            totalSpots,
            availableSpots,
            occupancyRate,
            activeCameras,
          })
        }

        if (camerasData) {
          // Add default values for required fields if they don't exist
          const formattedCameras = camerasData.map(camera => ({
            ...camera,
            ip_address: camera.ip_address || "192.168.1.20",
            port: camera.port || 4747,
            username: camera.username || "admin",
            password: camera.password || "",
            type: camera.type || "IP Camera"
          }))
          setCameras(formattedCameras)
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

        setRecentEvents([
          { time: "10:42 AM", event: "Spot A12 occupied", status: "Occupied" },
          { time: "10:38 AM", event: "Spot B05 vacated", status: "Available" },
          { time: "10:32 AM", event: "Spot C18 occupied", status: "Occupied" },
          { time: "10:28 AM", event: "Spot A09 vacated", status: "Available" },
        ])

        setStats({
          totalSpots: 120,
          availableSpots: 72,
          occupancyRate: 40,
          activeCameras: 8,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch cameras separately
  useEffect(() => {
    const fetchCameras = async () => {
      setCamerasLoading(true)
      try {
        const { data, error } = await supabase.from("cameras").select("*, parking_areas(name)").limit(6)

        if (error) throw error

        if (data) {
          setCameras(data)
        }
      } catch (error) {
        console.error("Error fetching cameras:", error)
        // Fallback data
        setCameras([
          { id: 1, name: "Camera 1", area_id: 1, status: "online", parking_areas: { name: "Area 1" } },
          { id: 2, name: "Camera 2", area_id: 1, status: "online", parking_areas: { name: "Area 1" } },
          { id: 3, name: "Camera 3", area_id: 2, status: "online", parking_areas: { name: "Area 2" } },
        ])
      } finally {
        setCamerasLoading(false)
      }
    }

    fetchCameras()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cameras">Cameras</TabsTrigger>
            <TabsTrigger value="spots">Parking Spots</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spots</CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSpots}</div>
                  <p className="text-xs text-muted-foreground">4 parking areas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Spots</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.availableSpots}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">+12</span> from yesterday
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-red-500">-4%</span> from yesterday
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Cameras</CardTitle>
                  <Camera className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeCameras}</div>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 relative group">
                <CardHeader>
                  <CardTitle>Occupancy Overview</CardTitle>
                  <CardDescription>Daily parking lot occupancy</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[240px]">
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
                          <LineChart data={occupancyData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
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
                <Link
                  href="/dashboard/analytics"
                  className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <p className="text-primary font-medium flex items-center">
                    View detailed analytics <ArrowUpRight className="ml-1 h-4 w-4" />
                  </p>
                </Link>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest parking events</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex h-[200px] items-center justify-center">
                      <p className="text-muted-foreground">Loading events...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentEvents.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{item.event}</p>
                            <p className="text-sm text-muted-foreground">{item.time}</p>
                          </div>
                          <div className="ml-auto font-medium">
                            <span className={item.status === "Occupied" ? "text-red-500" : "text-green-500"}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="cameras" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Camera Management</CardTitle>
                  <CardDescription>Configure and monitor your parking lot cameras</CardDescription>
                </div>
                <Link href="/dashboard/cameras/add">
                  <Button variant="outline">Add Camera</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {camerasLoading ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">Loading cameras...</p>
                  </div>
                ) : cameras.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cameras.map((camera) => (
                      <div key={camera.id} className="border rounded-lg overflow-hidden">
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          {camera.status === "online" ? (
                            <CameraStream
                              ip={camera.ip_address || "192.168.1.20"}
                              port={camera.port || 4747}
                              username={camera.username || "admin"}
                              password={camera.password || ""}
                              className="rounded-md"
                            />
                          ) : (
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium">{camera.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {camera.parking_areas?.name || `Parking Area ${Math.ceil(camera.id / 2)}`}
                          </p>
                          <div className="mt-2 flex items-center">
                            <span
                              className={`flex h-2 w-2 rounded-full ${camera.status === "online" ? "bg-green-500" : "bg-red-500"} mr-2`}
                            ></span>
                            <span className="text-sm">{camera.status === "online" ? "Online" : "Offline"}</span>
                            <Link href={`/dashboard/cameras/${camera.id}`} className="ml-auto">
                              <Button variant="ghost" size="sm" className="opacity-100">
                                View Details <ArrowUpRight className="ml-1 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Cameras Found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't added any cameras to your system yet.
                    </p>
                    <Link href="/dashboard/cameras/add">
                      <Button>Add Your First Camera</Button>
                    </Link>
                  </div>
                )}
                {cameras.length > 0 && (
                  <div className="mt-4 flex justify-center">
                    <Link href="/dashboard/cameras" className="text-primary hover:underline flex items-center">
                      View all cameras <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="spots" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Parking Spot Configuration</CardTitle>
                  <CardDescription>Configure and monitor individual parking spots</CardDescription>
                </div>
                <Link href="/dashboard/spot-configuration">
                  <Button variant="outline">Configure Spots</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full bg-muted rounded-md flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-6 gap-2 p-4">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className={`border rounded-md flex items-center justify-center ${i % 3 === 0 ? "bg-red-100 border-red-300" : "bg-green-100 border-green-300"}`}
                      >
                        <span className="text-xs font-medium">
                          {String.fromCharCode(65 + Math.floor(i / 6))}
                          {(i % 6) + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/dashboard/spot-configuration"
                    className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <p className="text-primary font-medium flex items-center">
                      Go to spot configuration <ArrowUpRight className="ml-1 h-4 w-4" />
                    </p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

