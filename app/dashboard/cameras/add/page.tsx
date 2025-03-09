"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ParkingCircle } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { AddCameraForm } from "@/components/add-camera-form"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface ParkingArea {
  id: number
  name: string
}

export default function AddCameraPage() {
  const [areas, setAreas] = useState<ParkingArea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const { data, error } = await supabase.from("parking_areas").select("*")

        if (error) throw error

        if (data && data.length > 0) {
          setAreas(data)
        } else {
          // If no areas found, show a warning toast
          toast({
            title: "No parking areas found",
            description: "You need to create parking areas before adding cameras.",
            variant: "warning",
          })
          // Set empty areas array
          setAreas([])
        }
      } catch (error) {
        console.error("Error fetching parking areas:", error)
        toast({
          title: "Error loading data",
          description: "Could not load parking areas. Please try again.",
          variant: "destructive",
        })
        setAreas([])
      } finally {
        setLoading(false)
      }
    }

    fetchAreas()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Add New Camera</h2>
          <Link href="/dashboard/parking-areas">
            <Button variant="outline">
              <ParkingCircle className="mr-2 h-4 w-4" />
              Manage Parking Areas
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading...</p>
          </div>
        ) : areas.length === 0 ? (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <ParkingCircle className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">No Parking Areas Available</h3>
                <p className="text-sm text-muted-foreground">
                  You need to create at least one parking area before you can add cameras.
                </p>
              </div>
              <Link href="/dashboard/parking-areas">
                <Button>Create Parking Area</Button>
              </Link>
            </div>
          </div>
        ) : (
          <AddCameraForm
            areas={areas}
            onSuccess={() => {
              toast({
                title: "Camera added successfully",
                description: "Your new camera has been added to the system.",
              })
              // Redirect to cameras page
              window.location.href = "/dashboard/cameras"
            }}
          />
        )}
      </div>
    </div>
  )
}

