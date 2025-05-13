"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Camera } from "lucide-react"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface ParkingArea {
  id: number
  name: string
}

interface AddCameraFormProps {
  areas: ParkingArea[]
  onSuccess?: () => void
}

export function AddCameraForm({ areas, onSuccess }: AddCameraFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    ip_address: "",
    port: 4747,
    username: "admin",
    password: "",
    area_id: areas.length > 0 ? areas[0].id.toString() : "",
    type: "IP Camera",
    resolution: "1080p",
    model: "IP-CAM 2000",
    status: "online",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form data
      if (!formData.name || !formData.name.trim()) {
        throw new Error("Please enter a camera name")
      }
      if (!formData.ip_address || !formData.ip_address.trim()) {
        throw new Error("Please enter an IP address")
      }
      if (!formData.area_id) {
        throw new Error("Please select a parking area")
      }

      // Insert new camera into database
      const { data, error } = await supabase
        .from("cameras")
        .insert({
          name: formData.name,
          ip_address: formData.ip_address,
          port: Number(formData.port),
          username: formData.username,
          password: formData.password, // In a real app, you'd want to encrypt this
          area_id: Number.parseInt(formData.area_id),
          type: formData.type,
          resolution: formData.resolution,
          model: formData.model,
          status: "online",
          last_maintenance: new Date().toISOString().split("T")[0],
        })
        .select()

      if (error) throw error

      toast({
        title: "Camera added successfully",
        description: `${formData.name} has been added to your system.`,
      })

      if (onSuccess) {
        onSuccess()
      } else {
        // Redirect to the cameras page
        router.push("/dashboard/cameras")
        router.refresh()
      }
    } catch (error) {
      console.error("Error adding camera:", error)
      toast({
        title: "Error adding camera",
        description: error instanceof Error ? error.message : "There was an error adding the camera. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Camera</CardTitle>
        <CardDescription>Connect a new camera to your parking management system</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Camera Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., North Entrance Camera"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip_address">
                IP Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ip_address"
                name="ip_address"
                placeholder="e.g., 192.168.1.100"
                value={formData.ip_address}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">
                Port <span className="text-red-500">*</span>
              </Label>
              <Input
                id="port"
                name="port"
                type="number"
                placeholder="e.g., 554"
                value={formData.port}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                placeholder="Username for camera access"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password for camera access"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area_id">
                Parking Area <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.area_id} onValueChange={(value) => handleSelectChange("area_id", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a parking area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.length > 0 ? (
                    areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No parking areas available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">The area where this camera is installed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Camera Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IP Camera">IP Camera</SelectItem>
                  <SelectItem value="PTZ Camera">PTZ Camera</SelectItem>
                  <SelectItem value="Dome Camera">Dome Camera</SelectItem>
                  <SelectItem value="Bullet Camera">Bullet Camera</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Select value={formData.resolution} onValueChange={(value) => handleSelectChange("resolution", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                  <SelectItem value="1440p">1440p</SelectItem>
                  <SelectItem value="4K">4K</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Camera Model</Label>
              <Input
                id="model"
                name="model"
                placeholder="e.g., IP-CAM 2000"
                value={formData.model}
                onChange={handleChange}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              "Adding..."
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Add Camera
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

