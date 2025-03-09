"use client"

import { useState, useEffect } from "react"
import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Camera, Car, ChevronLeft, ChevronRight, Cog, Home, LogOut, Map, ParkingCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Cameras",
    href: "/dashboard/cameras",
    icon: Camera,
  },
  {
    title: "Parking Areas",
    href: "/dashboard/parking-areas",
    icon: ParkingCircle,
  },
  {
    title: "Spot Configuration",
    href: "/dashboard/spot-configuration",
    icon: Map,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Cog,
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile on initial render and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Auto-close sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Check on initial render
    checkIfMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile)

    // Clean up event listener
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Link href="/" className="flex items-center">
            <Car className="h-6 w-6 text-primary" />
            <span className="ml-2 text-lg font-bold">ecoPark</span>
          </Link>
          <Button variant="ghost" size="icon" className="ml-4 md:hidden" onClick={toggleSidebar}>
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          <div className="ml-auto flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin</p>
                    <p className="text-xs leading-none text-muted-foreground">admin@ecopark.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer w-full flex items-center">
                    <Cog className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/logout"
                    className="cursor-pointer w-full flex items-center text-red-500 focus:text-red-500"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="flex flex-1">
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-0 md:w-16"
          } border-r bg-muted/40 transition-all duration-300 ease-in-out overflow-hidden`}
        >
          <div className="flex justify-end p-2 md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex flex-col gap-2 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center ${
                    sidebarOpen ? "justify-start" : "justify-center"
                  } gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span
                    className={`${sidebarOpen ? "opacity-100" : "opacity-0 hidden"} transition-opacity duration-300`}
                  >
                    {item.title}
                  </span>
                </Link>
              )
            })}
          </nav>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center md:justify-start md:px-4">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </div>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

