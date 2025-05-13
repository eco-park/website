"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { use } from "react"
import { Edit, Trash } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SpotEditor } from "@/components/spot-editor"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CameraStream } from "@/components/camera-stream"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface ParkingSpot {
  id: string
  vertices: { x: number; y: number }[]
  type: "standard" | "handicap" | "electric" | "compact"
  status: "available" | "occupied" | "reserved" | "maintenance"
  areaId: number
  cameraId: number
}

export default function CameraPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [camera, setCamera] = useState<any>(null)
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const cameraId = Number.parseInt(resolvedParams.id)

  // Form state for editing
  const [formData, setFormData] = useState({
    name: "",
    ip_address: "",
    port: 4747,
    username: "",
    password: "",
    area_id: "",
    model: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch camera details
        const { data: cameraData, error: cameraError } = await supabase
          .from("cameras")
          .select("*, parking_areas(*)")
          .eq("id", cameraId)
          .single()

        if (cameraError) throw cameraError

        if (cameraData) {
          setCamera(cameraData)
          // Initialize form data
          setFormData({
            name: cameraData.name || "",
            ip_address: cameraData.ip_address || "",
            port: cameraData.port || 554,
            username: cameraData.username || "admin",
            password: "", // Don't show actual password
            area_id: cameraData.area_id?.toString() || "1",
            model: cameraData.model || "IP-CAM 2000",
          })

          // Fetch spots for this camera
          const { data: spotsData, error: spotsError } = await supabase
            .from("parking_spots")
            .select("*")
            .eq("camera_id", cameraId)

          if (spotsError) throw spotsError

          if (spotsData) {
            // Transform data to match our component's expected format
            const formattedSpots: ParkingSpot[] = spotsData.map((spot) => ({
              id: spot.spot_id,
              vertices: spot.vertices,
              type: spot.type,
              status: spot.status,
              areaId: spot.area_id,
              cameraId: spot.camera_id,
            }))

            setSpots(formattedSpots)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error loading data",
          description: "There was an error loading the camera data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [cameraId])

  const handleDeleteCamera = async () => {
    try {
      // Delete associated parking spots first
      const { error: spotsError } = await supabase.from("parking_spots").delete().eq("camera_id", cameraId)

      if (spotsError) throw spotsError

      // Then delete the camera
      const { error } = await supabase.from("cameras").delete().eq("id", cameraId)

      if (error) throw error

      toast({
        title: "Camera deleted",
        description: "The camera has been successfully deleted.",
      })

      // Redirect to cameras page
      window.location.href = "/dashboard/cameras"
    } catch (error) {
      console.error("Error deleting camera:", error)
      toast({
        title: "Error deleting camera",
        description: "There was an error deleting the camera.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("cameras")
        .update({
          name: formData.name,
          ip_address: formData.ip_address,
          port: Number(formData.port),
          username: formData.username,
          ...(formData.password ? { password: formData.password } : {}), // Only update password if provided
          area_id: Number.parseInt(formData.area_id),
          model: formData.model,
        })
        .eq("id", cameraId)

      if (error) throw error

      toast({
        title: "Changes saved",
        description: "Camera settings have been updated successfully.",
      })

      // Refresh camera data
      const { data: updatedCamera, error: fetchError } = await supabase
        .from("cameras")
        .select("*, parking_areas(*)")
        .eq("id", cameraId)
        .single()

      if (fetchError) throw fetchError
      setCamera(updatedCamera)
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving changes:", error)
      toast({
        title: "Error saving changes",
        description: "There was an error updating the camera settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center space-x-2"></div>
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {loading ? "Loading..." : camera?.name || `Camera ${resolvedParams.id}`}
          </h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="mr-2 h-4 w-4" />
              {isEditing ? "Cancel Edit" : "Edit"}
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <p>Loading camera data...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Live Feed</CardTitle>
                  <CardDescription>
                    Real-time camera feed from{" "}
                    {camera?.parking_areas?.name || `Parking Area ${Math.ceil(cameraId / 2)}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    {camera ? (
                      <CameraStream
                        ip={camera.ip_address}
                        port={camera.port}
                        username={camera.username}
                        password={camera.password}
                        className="rounded-md"
                      />
                    ) : (
                      <img
                        src="/parking-lot.jpg"
                        alt="Parking Lot Camera Feed"
                        className="w-full h-full object-cover rounded-md"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Camera Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <p className="font-medium">Online</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                        <p className="font-medium">{camera?.type || "IP Camera"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Resolution</p>
                        <p className="font-medium">{camera?.resolution || "1080p"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                        <p className="font-medium">{camera?.ip_address || `192.168.1.${10 + cameraId}`}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <p className="font-medium">
                          {camera?.parking_areas?.name || `Parking Area ${Math.ceil(cameraId / 2)}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Last Maintenance</p>
                        <p className="font-medium">{camera?.last_maintenance || "2023-12-15"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Tabs defaultValue="spots" className="space-y-4">
              <TabsList>
                <TabsTrigger value="spots">Parking Spots</TabsTrigger>
                <TabsTrigger value="settings">Camera Settings</TabsTrigger>
                <TabsTrigger value="history">Event History</TabsTrigger>
              </TabsList>
              <TabsContent value="spots" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Parking Spot Configuration</CardTitle>
                    <CardDescription>Configure and mark parking spots visible from this camera</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {camera ? (
                      <SpotEditor
                        ip={camera.ip_address}
                        port={camera.port}
                        username={camera.username}
                        password={camera.password}
                        initialSpots={spots}
                        areaId={camera?.area_id || Math.ceil(cameraId / 2)}
                        cameraId={cameraId}
                        onSave={async (updatedSpots) => {
                          // Re-fetch spots from DB after save
                          const { data: spotsData, error: spotsError } = await supabase
                            .from("parking_spots")
                            .select("*")
                            .eq("camera_id", cameraId)
                          if (!spotsError && spotsData) {
                            const formattedSpots = spotsData.map((spot) => ({
                              id: spot.spot_id,
                              vertices: spot.vertices,
                              type: spot.type,
                              status: spot.status,
                              areaId: spot.area_id,
                              cameraId: spot.camera_id,
                            }))
                            setSpots(formattedSpots)
                          }
                          toast({
                            title: "Configuration saved",
                            description: `Successfully saved ${updatedSpots.length} parking spots.`,
                          })
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[400px]">
                        <p className="text-muted-foreground">Loading camera data...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Camera Settings</CardTitle>
                    <CardDescription>Configure camera settings and parameters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-sm font-medium">
                            Camera Name
                          </label>
                          <input
                            id="name"
                            name="name"
                            placeholder="Camera Name"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="ip_address" className="text-sm font-medium">
                            IP Address
                          </label>
                          <input
                            id="ip_address"
                            name="ip_address"
                            placeholder="IP Address"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.ip_address}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="username" className="text-sm font-medium">
                            Username
                          </label>
                          <input
                            id="username"
                            name="username"
                            placeholder="Username"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.username}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="password" className="text-sm font-medium">
                            Password
                          </label>
                          <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder={isEditing ? "Enter new password" : "••••••••"}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="area_id" className="text-sm font-medium">
                            Parking Area
                          </label>
                          <select
                            id="area_id"
                            name="area_id"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.area_id}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          >
                            <option value="1">Area 1</option>
                            <option value="2">Area 2</option>
                            <option value="3">Area 3</option>
                            <option value="4">Area 4</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="model" className="text-sm font-medium">
                            Camera Model
                          </label>
                          <input
                            id="model"
                            name="model"
                            placeholder="Camera Model"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.model}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="port" className="text-sm font-medium">
                            Port
                          </label>
                          <input
                            id="port"
                            name="port"
                            type="number"
                            placeholder="Port"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.port}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      {isEditing && (
                        <div className="flex justify-end">
                          <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Event History</CardTitle>
                    <CardDescription>Recent events detected by this camera</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { time: "10:42 AM", event: "Spot A1 occupied", status: "Occupied" },
                        { time: "10:38 AM", event: "Spot B2 vacated", status: "Available" },
                        { time: "10:32 AM", event: "Spot A3 occupied", status: "Occupied" },
                        { time: "10:28 AM", event: "Spot B4 vacated", status: "Available" },
                        { time: "10:25 AM", event: "Spot A2 vacated", status: "Available" },
                        { time: "10:18 AM", event: "Spot B1 occupied", status: "Occupied" },
                        { time: "10:15 AM", event: "Spot A4 occupied", status: "Occupied" },
                        { time: "10:10 AM", event: "Camera connection restored", status: "System" },
                        { time: "10:05 AM", event: "Camera connection lost", status: "System" },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center border-b pb-2">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{item.event}</p>
                            <p className="text-sm text-muted-foreground">{item.time}</p>
                          </div>
                          <div className="ml-auto font-medium">
                            <span
                              className={
                                item.status === "Occupied"
                                  ? "text-red-500"
                                  : item.status === "Available"
                                    ? "text-green-500"
                                    : "text-blue-500"
                              }
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this camera?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the camera and all associated parking spots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCamera}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

