"use client"

import { useState, useEffect } from "react"
import { Camera } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SpotEditor } from "@/components/spot-editor"
import { toast } from "@/components/ui/use-toast"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface ParkingArea {
  id: number
  name: string
  parking_lot_id: number
}

interface CameraData {
  id: number
  name: string
  area_id: number
}

interface ParkingSpot {
  id: string
  vertices: { x: number; y: number }[]
  type: "standard" | "handicap" | "electric" | "compact"
  status: "available" | "occupied" | "reserved" | "maintenance"
  areaId: number
  cameraId: number
}

export default function SpotConfigurationPage() {
  const [areas, setAreas] = useState<ParkingArea[]>([])
  const [cameras, setCameras] = useState<CameraData[]>([])
  const [selectedArea, setSelectedArea] = useState<string>("1")
  const [selectedCamera, setSelectedCamera] = useState<string>("1")
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch areas and cameras on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch parking areas
        const { data: areasData, error: areasError } = await supabase.from("parking_areas").select("*")

        if (areasError) throw areasError

        if (areasData && areasData.length > 0) {
          setAreas(areasData)
          setSelectedArea(areasData[0].id.toString())

          // Fetch cameras for the first area
          const { data: camerasData, error: camerasError } = await supabase
            .from("cameras")
            .select("*")
            .eq("area_id", areasData[0].id)

          if (camerasError) throw camerasError

          if (camerasData && camerasData.length > 0) {
            setCameras(camerasData)
            setSelectedCamera(camerasData[0].id.toString())

            // Fetch spots for the first camera
            await fetchSpots(camerasData[0].id, areasData[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error loading data",
          description: "There was an error loading the parking configuration data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch cameras when selected area changes
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const { data, error } = await supabase.from("cameras").select("*").eq("area_id", Number.parseInt(selectedArea))

        if (error) throw error

        if (data && data.length > 0) {
          setCameras(data)
          setSelectedCamera(data[0].id.toString())

          // Fetch spots for the first camera in this area
          await fetchSpots(data[0].id, Number.parseInt(selectedArea))
        } else {
          setCameras([])
          setSpots([])
        }
      } catch (error) {
        console.error("Error fetching cameras:", error)
      }
    }

    if (selectedArea) {
      fetchCameras()
    }
  }, [selectedArea])

  // Fetch spots when selected camera changes
  useEffect(() => {
    if (selectedCamera && selectedArea) {
      fetchSpots(Number.parseInt(selectedCamera), Number.parseInt(selectedArea))
    }
  }, [selectedCamera])

  // Fetch spots for a specific camera and area
  const fetchSpots = async (cameraId: number, areaId: number) => {
    try {
      const { data, error } = await supabase
        .from("parking_spots")
        .select("*")
        .eq("camera_id", cameraId)
        .eq("area_id", areaId)

      if (error) throw error

      if (data) {
        // Transform data to match our component's expected format
        const formattedSpots: ParkingSpot[] = data.map((spot) => ({
          id: spot.spot_id,
          vertices: spot.vertices,
          type: spot.type,
          status: spot.status,
          areaId: spot.area_id,
          cameraId: spot.camera_id,
        }))

        setSpots(formattedSpots)
      } else {
        setSpots([])
      }
    } catch (error) {
      console.error("Error fetching spots:", error)
      setSpots([])
    }
  }

  // Handle camera change
  const handleCameraChange = (cameraId: string) => {
    setSelectedCamera(cameraId)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Parking Spot Configuration</h2>
        </div>
        <Tabs value={selectedArea} onValueChange={setSelectedArea} className="space-y-4">
          <TabsList>
            {areas.map((area) => (
              <TabsTrigger key={area.id} value={area.id.toString()}>
                {area.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {areas.map((area) => (
            <TabsContent key={area.id} value={area.id.toString()} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{area.name} Configuration</CardTitle>
                  <CardDescription>Configure parking spots in {area.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Camera View</h3>
                      <div className="flex items-center space-x-2">
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={selectedCamera}
                          onChange={(e) => handleCameraChange(e.target.value)}
                        >
                          {cameras.map((camera) => (
                            <option key={camera.id} value={camera.id.toString()}>
                              {camera.name}
                            </option>
                          ))}
                        </select>
                        <Button variant="outline" size="sm">
                          <Camera className="h-4 w-4 mr-2" />
                          Switch Camera
                        </Button>
                      </div>
                    </div>

                    {loading ? (
                      <div className="h-[400px] flex items-center justify-center">
                        <p>Loading...</p>
                      </div>
                    ) : (
                      <SpotEditor
                        imageUrl="/parking-lot.jpg"
                        initialSpots={spots}
                        areaId={Number.parseInt(selectedArea)}
                        cameraId={Number.parseInt(selectedCamera)}
                        onSave={(updatedSpots) => {
                          setSpots(updatedSpots)
                          toast({
                            title: "Configuration saved",
                            description: `Successfully saved ${updatedSpots.length} parking spots.`,
                          })
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}

