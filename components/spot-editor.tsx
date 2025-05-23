"use client"

import { useState, useRef, useEffect, type MouseEvent } from "react"
import { Trash, Save, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"
import { CameraStream } from "@/components/camera-stream"

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
  ip: string;
  port: number;
  username?: string;
  password?: string;
  initialSpots?: ParkingSpot[];
  areaId: number;
  cameraId: number;
  onSave?: (spots: ParkingSpot[]) => void;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to generate the next unique spot ID
function getNextSpotId(existingIds: string[]): string {
  let letter = 'A';
  let number = 1;
  while (true) {
    const candidate = `${letter}${number}`;
    if (!existingIds.includes(candidate)) return candidate;
    number++;
    if (number > 9) {
      number = 1;
      letter = String.fromCharCode(letter.charCodeAt(0) + 1);
    }
  }
}

export function SpotEditor({ ip, port, username, password, initialSpots = [], areaId, cameraId, onSave }: SpotEditorProps) {
  const [spots, setSpots] = useState<ParkingSpot[]>(initialSpots)
  const [selectedSpotIndex, setSelectedSpotIndex] = useState<number | null>(null)
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentVertices, setCurrentVertices] = useState<{ x: number; y: number }[]>([])
  const [editMode, setEditMode] = useState<"select" | "draw" | "move">("select")
  const [isSaving, setIsSaving] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Always generate the next unique spot ID based on current spots
  const nextId = getNextSpotId(spots.map(s => s.id))

  // Sync spots state with initialSpots prop
  useEffect(() => {
    setSpots(initialSpots)
  }, [initialSpots])

  // Update image size when container size changes
  useEffect(() => {
    const updateImageSize = () => {
      if (containerRef.current) {
        setImageSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }
    updateImageSize()
    window.addEventListener("resize", updateImageSize)
    return () => {
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

          // No need to generate nextId here, it's always computed from current spots

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
        <div className="space-x-2">
          <Button
            variant={editMode === "select" ? "default" : "outline"}
            onClick={() => setEditMode("select")}
          >
            Select
          </Button>
          <Button
            variant={editMode === "draw" ? "default" : "outline"}
            onClick={() => setEditMode("draw")}
          >
            Draw
          </Button>
          <Button
            variant={editMode === "move" ? "default" : "outline"}
            onClick={() => setEditMode("move")}
          >
            Move
          </Button>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleCancelDrawing}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <CameraStream
          ip={ip}
          port={port}
          username={username}
          password={password}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Draw the spots */}
        {spots.map((spot, index) => (
          <div
            key={spot.id}
            className={`absolute inset-0 pointer-events-none ${
              index === selectedSpotIndex ? "ring-2 ring-primary" : ""
            }`}
          >
            <svg className="w-full h-full">
              <polygon
                points={spot.vertices
                  .map((v) => {
                    const abs = toAbsoluteCoords(v.x, v.y)
                    return `${abs.x},${abs.y}`
                  })
                  .join(" ")}
                fill={spot.status === "available" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                stroke={index === selectedSpotIndex ? "rgb(var(--primary))" : "rgba(0, 0, 0, 0.2)"}
                strokeWidth="2"
              />
              {spot.vertices.map((vertex, vertexIndex) => {
                const abs = toAbsoluteCoords(vertex.x, vertex.y)
                return (
                  <circle
                    key={vertexIndex}
                    cx={abs.x}
                    cy={abs.y}
                    r="6"
                    fill={index === selectedSpotIndex && vertexIndex === selectedVertexIndex ? "rgb(var(--primary))" : "white"}
                    stroke="rgba(0, 0, 0, 0.2)"
                    strokeWidth="2"
                  />
                )
              })}
              {/* Add spot ID in the center */}
              <text
                x={toAbsoluteCoords(
                  spot.vertices.reduce((sum, v) => sum + v.x, 0) / spot.vertices.length,
                  spot.vertices.reduce((sum, v) => sum + v.y, 0) / spot.vertices.length
                ).x}
                y={toAbsoluteCoords(
                  spot.vertices.reduce((sum, v) => sum + v.x, 0) / spot.vertices.length,
                  spot.vertices.reduce((sum, v) => sum + v.y, 0) / spot.vertices.length
                ).y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="black"
                fontWeight="bold"
                fontSize="14"
                className="pointer-events-none"
              >
                {spot.id}
              </text>
            </svg>
          </div>
        ))}

        {/* Draw the current spot being created */}
        {currentVertices.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full">
              <polyline
                points={currentVertices.map((v) => {
                  const abs = toAbsoluteCoords(v.x, v.y)
                  return `${abs.x},${abs.y}`
                }).join(" ")}
                fill="none"
                stroke="rgb(var(--primary))"
                strokeWidth="2"
                strokeDasharray="4"
              />
              {currentVertices.map((vertex, index) => {
                const abs = toAbsoluteCoords(vertex.x, vertex.y)
                return (
                  <circle
                    key={index}
                    cx={abs.x}
                    cy={abs.y}
                    r="6"
                    fill="white"
                    stroke="rgb(var(--primary))"
                    strokeWidth="2"
                  />
                )
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Spot details panel */}
      {selectedSpotIndex !== null && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="spotId">Spot ID</Label>
              <Input
                id="spotId"
                value={spots[selectedSpotIndex].id}
                onChange={(e) => updateSpotProperty("id", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spotType">Type</Label>
              <Select
                value={spots[selectedSpotIndex].type}
                onValueChange={(value) => updateSpotProperty("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="handicap">Handicap</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="spotStatus">Status</Label>
              <Select
                value={spots[selectedSpotIndex].status}
                onValueChange={(value) => updateSpotProperty("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
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
          <Button variant="destructive" onClick={handleDeleteSpot}>
            <Trash className="mr-2 h-4 w-4" />
            Delete Spot
          </Button>
        </div>
      )}
    </div>
  )
}

