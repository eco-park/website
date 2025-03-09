"use client"

import { useState, useRef, useEffect, type MouseEvent } from "react"
import { Trash, Save, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"

// Define the shape of a parking spot with quadrilateral coordinates
interface ParkingSpot {
  id: string
  // Four vertices of the quadrilateral (using relative coordinates 0-1)
  vertices: { x: number; y: number }[]
  type: "standard" | "handicap" | "electric" | "compact"
  status: "available" | "occupied" | "reserved" | "maintenance"
  areaId: number
  cameraId: number
}

interface SpotEditorProps {
  imageUrl: string
  initialSpots?: ParkingSpot[]
  areaId: number
  cameraId: number
  onSave?: (spots: ParkingSpot[]) => void
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export function SpotEditor({ imageUrl, initialSpots = [], areaId, cameraId, onSave }: SpotEditorProps) {
  const [spots, setSpots] = useState<ParkingSpot[]>(initialSpots)
  const [selectedSpotIndex, setSelectedSpotIndex] = useState<number | null>(null)
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentVertices, setCurrentVertices] = useState<{ x: number; y: number }[]>([])
  const [editMode, setEditMode] = useState<"select" | "draw" | "move">("select")
  const [nextId, setNextId] = useState("A1")
  const [isSaving, setIsSaving] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Update image size when it loads
  useEffect(() => {
    const updateImageSize = () => {
      if (imageRef.current) {
        setImageSize({
          width: imageRef.current.clientWidth,
          height: imageRef.current.clientHeight,
        })
      }
    }

    // Initial size
    if (imageRef.current && imageRef.current.complete) {
      updateImageSize()
    }

    // Add event listener for image load
    const imageElement = imageRef.current
    if (imageElement) {
      imageElement.addEventListener("load", updateImageSize)
    }

    // Add window resize listener
    window.addEventListener("resize", updateImageSize)

    return () => {
      if (imageElement) {
        imageElement.removeEventListener("load", updateImageSize)
      }
      window.removeEventListener("resize", updateImageSize)
    }
  }, [])

  // Convert absolute coordinates to relative (0-1)
  const toRelativeCoords = (x: number, y: number) => {
    if (imageSize.width === 0 || imageSize.height === 0) return { x: 0, y: 0 }
    return {
      x: x / imageSize.width,
      y: y / imageSize.height,
    }
  }

  // Convert relative coordinates (0-1) to absolute pixels
  const toAbsoluteCoords = (x: number, y: number) => {
    return {
      x: x * imageSize.width,
      y: y * imageSize.height,
    }
  }

  // Calculate relative position within the container
  const getRelativePosition = (e: MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 }

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert to relative coordinates (0-1)
    return toRelativeCoords(x, y)
  }

  // Handle mouse click for drawing or selecting
  const handleMouseDown = (e: MouseEvent) => {
    const position = getRelativePosition(e)

    if (editMode === "draw") {
      // If we're drawing a new spot
      if (currentVertices.length < 4) {
        // Add a new vertex
        setCurrentVertices([...currentVertices, position])

        // If we've added all 4 vertices, create the spot
        if (currentVertices.length === 3) {
          const newSpot: ParkingSpot = {
            id: nextId,
            vertices: [...currentVertices, position],
            type: "standard",
            status: "available",
            areaId,
            cameraId,
          }

          setSpots([...spots, newSpot])
          setSelectedSpotIndex(spots.length)
          setCurrentVertices([])

          // Generate next ID
          const lastId = nextId
          const letter = lastId.charAt(0)
          const number = Number.parseInt(lastId.substring(1))

          if (number < 9) {
            setNextId(`${letter}${number + 1}`)
          } else {
            const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1)
            setNextId(`${nextLetter}1`)
          }

          // Switch back to select mode after drawing
          setEditMode("select")
        }
      }
    } else if (editMode === "select") {
      // Check if we clicked on a vertex of a spot
      let foundVertex = false

      for (let i = 0; i < spots.length; i++) {
        const spot = spots[i]

        for (let j = 0; j < spot.vertices.length; j++) {
          const vertex = spot.vertices[j]
          // Convert relative vertex to absolute for distance calculation
          const absVertex = toAbsoluteCoords(vertex.x, vertex.y)
          const absPosition = toAbsoluteCoords(position.x, position.y)

          const dx = absPosition.x - absVertex.x
          const dy = absPosition.y - absVertex.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // If we're close enough to a vertex
          if (distance < 10) {
            setSelectedSpotIndex(i)
            setSelectedVertexIndex(j)
            foundVertex = true
            break
          }
        }

        if (foundVertex) break
      }

      // If we didn't click on a vertex, check if we clicked inside a spot
      if (!foundVertex) {
        const clickedSpotIndex = spots.findIndex((spot) => isPointInPolygon(position, spot.vertices))
        setSelectedSpotIndex(clickedSpotIndex !== -1 ? clickedSpotIndex : null)
        setSelectedVertexIndex(null)
      }
    } else if (editMode === "move" && selectedSpotIndex !== null) {
      // Start moving the selected spot
      setIsDrawing(true)
    }
  }

  // Check if a point is inside a polygon
  const isPointInPolygon = (point: { x: number; y: number }, vertices: { x: number; y: number }[]) => {
    let inside = false

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x
      const yi = vertices[i].y
      const xj = vertices[j].x
      const yj = vertices[j].y

      const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

      if (intersect) inside = !inside
    }

    return inside
  }

  // Handle mouse move for drawing or moving
  const handleMouseMove = (e: MouseEvent) => {
    if (editMode === "move" && isDrawing && selectedSpotIndex !== null) {
      // Move the selected spot
      const position = getRelativePosition(e)

      if (selectedVertexIndex !== null) {
        // Move just the selected vertex
        const newSpots = [...spots]
        newSpots[selectedSpotIndex] = {
          ...newSpots[selectedSpotIndex],
          vertices: newSpots[selectedSpotIndex].vertices.map((vertex, index) =>
            index === selectedVertexIndex ? position : vertex,
          ),
        }

        setSpots(newSpots)
      } else {
        // Move the entire spot
        const newSpots = [...spots]
        const spot = newSpots[selectedSpotIndex]

        // Calculate the center of the spot
        const center = {
          x: spot.vertices.reduce((sum, v) => sum + v.x, 0) / spot.vertices.length,
          y: spot.vertices.reduce((sum, v) => sum + v.y, 0) / spot.vertices.length,
        }

        // Calculate the movement
        const dx = position.x - center.x
        const dy = position.y - center.y

        // Move all vertices
        newSpots[selectedSpotIndex] = {
          ...spot,
          vertices: spot.vertices.map((vertex) => ({
            x: vertex.x + dx,
            y: vertex.y + dy,
          })),
        }

        setSpots(newSpots)
      }
    }
  }

  // Handle mouse up for finishing drawing or moving
  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false)
    }
  }

  // Delete the selected spot
  const handleDeleteSpot = () => {
    if (selectedSpotIndex !== null) {
      const newSpots = [...spots]
      newSpots.splice(selectedSpotIndex, 1)
      setSpots(newSpots)
      setSelectedSpotIndex(null)
      setSelectedVertexIndex(null)
    }
  }

  // Update spot properties
  const updateSpotProperty = (property: keyof ParkingSpot, value: any) => {
    if (selectedSpotIndex !== null) {
      const newSpots = [...spots]
      newSpots[selectedSpotIndex] = {
        ...newSpots[selectedSpotIndex],
        [property]: value,
      }
      setSpots(newSpots)
    }
  }

  // Save spots to Supabase
  const handleSave = async () => {
    setIsSaving(true)

    try {
      // First, delete existing spots for this camera and area
      await supabase.from("parking_spots").delete().eq("camera_id", cameraId).eq("area_id", areaId)

      // Then insert the new spots
      const { data, error } = await supabase
        .from("parking_spots")
        .insert(
          spots.map((spot) => ({
            spot_id: spot.id,
            vertices: spot.vertices,
            type: spot.type,
            status: spot.status,
            area_id: areaId,
            camera_id: cameraId,
          })),
        )
        .select()

      if (error) throw error

      toast({
        title: "Configuration saved",
        description: `Successfully saved ${spots.length} parking spots.`,
      })

      if (onSave) {
        onSave(spots)
      }
    } catch (error) {
      console.error("Error saving spots:", error)
      toast({
        title: "Error saving configuration",
        description: "There was an error saving your parking spot configuration.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel drawing
  const handleCancelDrawing = () => {
    setCurrentVertices([])
    setEditMode("select")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={editMode === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode("select")}
          >
            Select
          </Button>
          <Button
            variant={editMode === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setEditMode("draw")
              setCurrentVertices([])
              setSelectedSpotIndex(null)
              setSelectedVertexIndex(null)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Draw Spot
          </Button>
          <Button
            variant={editMode === "move" ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode("move")}
            disabled={selectedSpotIndex === null}
          >
            Move
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleDeleteSpot} disabled={selectedSpotIndex === null}>
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {editMode === "draw" && (
        <div className="bg-muted p-2 rounded-md flex items-center justify-between">
          <p className="text-sm">
            {currentVertices.length === 0
              ? "Click to place the first corner of the parking spot"
              : currentVertices.length === 1
                ? "Click to place the second corner"
                : currentVertices.length === 2
                  ? "Click to place the third corner"
                  : "Click to place the final corner"}
            <span className="ml-2 text-muted-foreground">({currentVertices.length}/4 points)</span>
          </p>
          <Button variant="ghost" size="sm" onClick={handleCancelDrawing}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative border rounded-md overflow-hidden"
        style={{ cursor: editMode === "draw" ? "crosshair" : "default" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img ref={imageRef} src={imageUrl || "/parking-lot.jpg"} alt="Parking Lot" className="w-full h-auto" />

        {/* Render all parking spots */}
        {spots.map((spot, index) => (
          <div key={index} className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" className="absolute inset-0">
              <polygon
                points={spot.vertices
                  .map((v) => {
                    const abs = toAbsoluteCoords(v.x, v.y)
                    return `${abs.x},${abs.y}`
                  })
                  .join(" ")}
                fill={index === selectedSpotIndex ? "rgba(59, 130, 246, 0.2)" : "rgba(16, 185, 129, 0.1)"}
                stroke={index === selectedSpotIndex ? "#3b82f6" : "#10b981"}
                strokeWidth="2"
              />

              {/* Render vertices as draggable points */}
              {spot.vertices.map((vertex, vIndex) => {
                const abs = toAbsoluteCoords(vertex.x, vertex.y)
                return (
                  <circle
                    key={vIndex}
                    cx={abs.x}
                    cy={abs.y}
                    r={selectedSpotIndex === index && selectedVertexIndex === vIndex ? 6 : 4}
                    fill={selectedSpotIndex === index && selectedVertexIndex === vIndex ? "#3b82f6" : "#10b981"}
                    className="pointer-events-none"
                  />
                )
              })}

              {/* Render spot ID in the center */}
              <text
                x={
                  toAbsoluteCoords(
                    spot.vertices.reduce((sum, v) => sum + v.x, 0) / spot.vertices.length,
                    spot.vertices.reduce((sum, v) => sum + v.y, 0) / spot.vertices.length,
                  ).x
                }
                y={
                  toAbsoluteCoords(
                    spot.vertices.reduce((sum, v) => sum + v.x, 0) / spot.vertices.length,
                    spot.vertices.reduce((sum, v) => sum + v.y, 0) / spot.vertices.length,
                  ).y
                }
                textAnchor="middle"
                dominantBaseline="middle"
                fill="black"
                fontWeight="bold"
                fontSize="12"
              >
                {spot.id}
              </text>
            </svg>
          </div>
        ))}

        {/* Render current vertices being placed */}
        {currentVertices.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" className="absolute inset-0">
              {/* Draw lines between placed vertices */}
              {currentVertices.length > 1 && (
                <polyline
                  points={currentVertices
                    .map((v) => {
                      const abs = toAbsoluteCoords(v.x, v.y)
                      return `${abs.x},${abs.y}`
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="4"
                />
              )}

              {/* Draw vertices */}
              {currentVertices.map((vertex, index) => {
                const abs = toAbsoluteCoords(vertex.x, vertex.y)
                return <circle key={index} cx={abs.x} cy={abs.y} r={5} fill="#3b82f6" />
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Spot properties editor */}
      {selectedSpotIndex !== null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Spot Details</h3>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="spot-id">Spot ID</Label>
                <Input
                  id="spot-id"
                  value={spots[selectedSpotIndex].id}
                  onChange={(e) => updateSpotProperty("id", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="spot-type">Spot Type</Label>
                <Select
                  value={spots[selectedSpotIndex].type}
                  onValueChange={(value) => updateSpotProperty("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="handicap">Handicap</SelectItem>
                    <SelectItem value="electric">Electric Vehicle</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="spot-status">Current Status</Label>
                <Select
                  value={spots[selectedSpotIndex].status}
                  onValueChange={(value) => updateSpotProperty("status", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Vertex Coordinates</h3>
            <div className="space-y-2">
              {spots[selectedSpotIndex].vertices.map((vertex, vIndex) => {
                const abs = toAbsoluteCoords(vertex.x, vertex.y)
                return (
                  <div key={vIndex} className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`vertex-${vIndex}-x`}>Vertex {vIndex + 1} X</Label>
                      <Input
                        id={`vertex-${vIndex}-x`}
                        type="number"
                        value={Math.round(abs.x)}
                        onChange={(e) => {
                          const newSpots = [...spots]
                          const relX = toRelativeCoords(Number(e.target.value), 0).x
                          newSpots[selectedSpotIndex].vertices[vIndex].x = relX
                          setSpots(newSpots)
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`vertex-${vIndex}-y`}>Vertex {vIndex + 1} Y</Label>
                      <Input
                        id={`vertex-${vIndex}-y`}
                        type="number"
                        value={Math.round(abs.y)}
                        onChange={(e) => {
                          const newSpots = [...spots]
                          const relY = toRelativeCoords(0, Number(e.target.value)).y
                          newSpots[selectedSpotIndex].vertices[vIndex].y = relY
                          setSpots(newSpots)
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

