"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Edit, Plus, Trash } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface ParkingArea {
  id: number
  name: string
  description?: string
  total_spots?: number
  parking_lot_id?: number
  created_at?: string
}

export default function ParkingAreasPage() {
  const [areas, setAreas] = useState<ParkingArea[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedArea, setSelectedArea] = useState<ParkingArea | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    total_spots: "0",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("parking_areas").select("*").order("id")

      if (error) throw error

      if (data) {
        setAreas(data)
      }
    } catch (error) {
      console.error("Error fetching parking areas:", error)
      toast({
        title: "Error loading data",
        description: "Could not load parking areas. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddArea = async () => {
    setIsSubmitting(true)
    try {
      // Validate form data
      if (!formData.name || !formData.name.trim()) {
        throw new Error("Please enter an area name")
      }

      const totalSpots = Number.parseInt(formData.total_spots)
      if (isNaN(totalSpots) || totalSpots < 0) {
        throw new Error("Total spots must be a positive number")
      }

      // Insert new area into database
      const { data, error } = await supabase
        .from("parking_areas")
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          total_spots: totalSpots,
          parking_lot_id: 1, // Default parking lot ID
        })
        .select()

      if (error) throw error

      toast({
        title: "Area added successfully",
        description: `${formData.name} has been added to your system.`,
      })

      // Reset form and close dialog
      setFormData({
        name: "",
        description: "",
        total_spots: "0",
      })
      setIsAddDialogOpen(false)

      // Refresh areas list
      fetchAreas()
    } catch (error) {
      console.error("Error adding area:", error)
      toast({
        title: "Error adding area",
        description: error instanceof Error ? error.message : "There was an error adding the area. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditArea = async () => {
    if (!selectedArea) return

    setIsSubmitting(true)
    try {
      // Validate form data
      if (!formData.name || !formData.name.trim()) {
        throw new Error("Please enter an area name")
      }

      const totalSpots = Number.parseInt(formData.total_spots)
      if (isNaN(totalSpots) || totalSpots < 0) {
        throw new Error("Total spots must be a positive number")
      }

      // Update area in database
      const { error } = await supabase
        .from("parking_areas")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          total_spots: totalSpots,
        })
        .eq("id", selectedArea.id)

      if (error) throw error

      toast({
        title: "Area updated successfully",
        description: `${formData.name} has been updated.`,
      })

      // Reset form and close dialog
      setFormData({
        name: "",
        description: "",
        total_spots: "0",
      })
      setIsEditDialogOpen(false)
      setSelectedArea(null)

      // Refresh areas list
      fetchAreas()
    } catch (error) {
      console.error("Error updating area:", error)
      toast({
        title: "Error updating area",
        description: error instanceof Error ? error.message : "There was an error updating the area. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteArea = async () => {
    if (!selectedArea) return

    try {
      // Check if there are cameras associated with this area
      const { data: camerasData, error: camerasError } = await supabase
        .from("cameras")
        .select("id")
        .eq("area_id", selectedArea.id)

      if (camerasError) throw camerasError

      if (camerasData && camerasData.length > 0) {
        throw new Error(
          `Cannot delete this area because it has ${camerasData.length} camera(s) associated with it. Please reassign or delete these cameras first.`,
        )
      }

      // Check if there are parking spots associated with this area
      const { data: spotsData, error: spotsError } = await supabase
        .from("parking_spots")
        .select("id")
        .eq("area_id", selectedArea.id)

      if (spotsError) throw spotsError

      if (spotsData && spotsData.length > 0) {
        throw new Error(
          `Cannot delete this area because it has ${spotsData.length} parking spot(s) associated with it. Please reassign or delete these spots first.`,
        )
      }

      // Delete the area
      const { error } = await supabase.from("parking_areas").delete().eq("id", selectedArea.id)

      if (error) throw error

      toast({
        title: "Area deleted successfully",
        description: `${selectedArea.name} has been deleted.`,
      })

      // Reset and close dialog
      setIsDeleteDialogOpen(false)
      setSelectedArea(null)

      // Refresh areas list
      fetchAreas()
    } catch (error) {
      console.error("Error deleting area:", error)
      toast({
        title: "Error deleting area",
        description: error instanceof Error ? error.message : "There was an error deleting the area. Please try again.",
        variant: "destructive",
      })
      setIsDeleteDialogOpen(false)
    }
  }

  const openEditDialog = (area: ParkingArea) => {
    setSelectedArea(area)
    setFormData({
      name: area.name,
      description: area.description || "",
      total_spots: (area.total_spots || 0).toString(),
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (area: ParkingArea) => {
    setSelectedArea(area)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Parking Areas</h2>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Area
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading parking areas...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {areas.length > 0 ? (
              areas.map((area) => (
                <Card key={area.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>{area.name}</CardTitle>
                      <CardDescription>{area.description || "No description provided"}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(area)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(area)}>
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Spots</p>
                        <p className="font-medium">{area.total_spots || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Created</p>
                        <p className="font-medium">
                          {area.created_at ? new Date(area.created_at).toLocaleDateString() : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Parking Areas Found</CardTitle>
                  <CardDescription>You haven't added any parking areas to your system yet.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Parking Area
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Add Area Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Parking Area</DialogTitle>
            <DialogDescription>Create a new parking area in your system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Area Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., North Parking Lot"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="e.g., Located at the north entrance"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_spots">
                Total Parking Spots <span className="text-red-500">*</span>
              </Label>
              <Input
                id="total_spots"
                name="total_spots"
                type="number"
                min="0"
                placeholder="e.g., 50"
                value={formData.total_spots}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddArea} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Area"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Area Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Parking Area</DialogTitle>
            <DialogDescription>Update the details of this parking area.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Area Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                name="name"
                placeholder="e.g., North Parking Lot"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                name="description"
                placeholder="e.g., Located at the north entrance"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-total_spots">
                Total Parking Spots <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-total_spots"
                name="total_spots"
                type="number"
                min="0"
                placeholder="e.g., 50"
                value={formData.total_spots}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditArea} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this parking area?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the parking area "{selectedArea?.name}" and all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArea}
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

