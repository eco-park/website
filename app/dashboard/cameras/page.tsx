"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowUpRight, Camera, Plus } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface CameraType {
  id: number
  name: string
  area_id: number
  status: string
  type: string
  ip_address: string
  parking_areas?: {
    name: string
  }
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<CameraType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const { data, error } = await supabase.from("cameras").select("*, parking_areas(name)")

        if (error) throw error

        if (data) {
          setCameras(data)
        }
      } catch (error) {
        console.error("Error fetching cameras:", error)
        toast({
          title: "Error loading cameras",
          description: "Could not load camera data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCameras()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Camera Management</h2>
          <Link href="/dashboard/cameras/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Camera
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading cameras...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras.length > 0 ? (
              cameras.map((camera) => (
                <div
                  key={camera.id}
                  className="border rounded-lg overflow-hidden group hover:border-primary transition-colors"
                >
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground" />
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View Details <ArrowUpRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardHeader>
                    <CardTitle>No Cameras Found</CardTitle>
                    <CardDescription>You haven't added any cameras to your system yet.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Link href="/dashboard/cameras/add">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Camera
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

