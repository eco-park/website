import { CameraStream } from "@/components/camera-stream";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface Camera {
  id: string;
  name: string;
  url: string;
  port: number;
  username: string;
  password: string;
  status: "online" | "offline";
}

export default function SpotDetailsPage({ params }: { params: { id: string } }) {
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [formData, setFormData] = useState({
    // ... existing form data ...
    camera: {
      id: "",
      name: "",
      url: "",
      port: 4747,
      username: "",
      password: "",
    },
  });

  // ... existing code ...

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="camera">Camera</Label>
          <Select
            value={selectedCameraId}
            onValueChange={(value) => {
              setSelectedCameraId(value);
              const camera = cameras.find((c) => c.id === value);
              if (camera) {
                setFormData((prev) => ({
                  ...prev,
                  camera: {
                    id: camera.id,
                    name: camera.name,
                    url: camera.url,
                    port: camera.port,
                    username: camera.username,
                    password: camera.password,
                  },
                }));
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a camera" />
            </SelectTrigger>
            <SelectContent>
              {cameras.map((camera) => (
                <SelectItem key={camera.id} value={camera.id}>
                  {camera.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedCameraId && (
          <div className="space-y-2">
            <Label>Camera Preview</Label>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <CameraStream
                ip={cameras.find((c) => c.id === selectedCameraId)?.url || ""}
                port={cameras.find((c) => c.id === selectedCameraId)?.port || 554}
                username={cameras.find((c) => c.id === selectedCameraId)?.username || ""}
                password={cameras.find((c) => c.id === selectedCameraId)?.password || ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// ... existing code ... 
