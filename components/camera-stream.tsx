import { useEffect, useState } from 'react'

interface CameraStreamProps {
  ip: string
  port: number
  username?: string
  password?: string
  className?: string
  onError?: () => void
}

export function CameraStream({ ip, port, username, password, className = '', onError }: CameraStreamProps) {
  const [error, setError] = useState<string | null>(null)
  const [streamUrl, setStreamUrl] = useState<string>('')

  useEffect(() => {
    console.log('CameraStream useEffect called with:', { ip, port })
    const url = `http://${ip}:${port}/video`
    console.log('Setting stream URL:', url)
    setStreamUrl(url)
  }, [ip, port])

  if (error) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-muted ${className}`}>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!streamUrl) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-muted ${className}`}>
        <p className="text-sm text-muted-foreground">Initializing stream...</p>
      </div>
    )
  }

  return (
    <img
      src={streamUrl}
      className={`w-full h-full object-cover ${className}`}
      alt="Camera Stream"
      onError={(e) => {
        console.error('Image load error:', e)
        setError('Failed to load camera stream')
        if (onError) onError()
      }}
    />
  )
} 