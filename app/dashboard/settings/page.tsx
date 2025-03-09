"use client"

import type React from "react"

import { useState } from "react"
import { Save } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: "ecoPark",
    contactEmail: "admin@ecopark.com",
    contactPhone: "+1 (555) 123-4567",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    occupancyAlerts: true,
    maintenanceAlerts: true,
    securityAlerts: true,
    dailyReports: true,
    weeklyReports: true,
    monthlyReports: true,
  })

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    cameraRefreshRate: "5",
    dataRetentionPeriod: "30",
    backupFrequency: "daily",
    maintenanceWindow: "sunday",
    analyticsEnabled: true,
    debugMode: false,
    apiAccess: true,
  })

  // Handle general settings change
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGeneralSettings((prev) => ({ ...prev, [name]: value }))
  }

  // Handle select change
  const handleSelectChange = (section: string, name: string, value: string) => {
    if (section === "general") {
      setGeneralSettings((prev) => ({ ...prev, [name]: value }))
    } else if (section === "system") {
      setSystemSettings((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Handle notification toggle
  const handleNotificationToggle = (name: string) => {
    setNotificationSettings((prev) => ({ ...prev, [name]: !prev[name as keyof typeof prev] }))
  }

  // Handle system toggle
  const handleSystemToggle = (name: string) => {
    setSystemSettings((prev) => ({ ...prev, [name]: !prev[name as keyof typeof prev] }))
  }

  // Save settings
  const saveSettings = async () => {
    setSaving(true)

    try {
      // In a real app, you would save these to your database
      // For this example, we'll just simulate a successful save
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error saving settings",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="users">Users & Permissions</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage your organization and display preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={generalSettings.companyName}
                      onChange={handleGeneralChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={generalSettings.contactEmail}
                      onChange={handleGeneralChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      value={generalSettings.contactPhone}
                      onChange={handleGeneralChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={generalSettings.timezone}
                      onValueChange={(value) => handleSelectChange("general", "timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      value={generalSettings.dateFormat}
                      onValueChange={(value) => handleSelectChange("general", "dateFormat", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeFormat">Time Format</Label>
                    <Select
                      value={generalSettings.timeFormat}
                      onValueChange={(value) => handleSelectChange("general", "timeFormat", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Channels</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications" className="font-medium">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={() => handleNotificationToggle("emailNotifications")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="smsNotifications" className="font-medium">
                          SMS Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                      </div>
                      <Switch
                        id="smsNotifications"
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={() => handleNotificationToggle("smsNotifications")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="pushNotifications" className="font-medium">
                          Push Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive push notifications</p>
                      </div>
                      <Switch
                        id="pushNotifications"
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={() => handleNotificationToggle("pushNotifications")}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Alert Types</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="occupancyAlerts" className="font-medium">
                          Occupancy Alerts
                        </Label>
                        <p className="text-sm text-muted-foreground">Alerts for parking lot capacity changes</p>
                      </div>
                      <Switch
                        id="occupancyAlerts"
                        checked={notificationSettings.occupancyAlerts}
                        onCheckedChange={() => handleNotificationToggle("occupancyAlerts")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="maintenanceAlerts" className="font-medium">
                          Maintenance Alerts
                        </Label>
                        <p className="text-sm text-muted-foreground">Alerts for system maintenance</p>
                      </div>
                      <Switch
                        id="maintenanceAlerts"
                        checked={notificationSettings.maintenanceAlerts}
                        onCheckedChange={() => handleNotificationToggle("maintenanceAlerts")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="securityAlerts" className="font-medium">
                          Security Alerts
                        </Label>
                        <p className="text-sm text-muted-foreground">Alerts for security events</p>
                      </div>
                      <Switch
                        id="securityAlerts"
                        checked={notificationSettings.securityAlerts}
                        onCheckedChange={() => handleNotificationToggle("securityAlerts")}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Reports</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="dailyReports" className="font-medium">
                          Daily Reports
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive daily summary reports</p>
                      </div>
                      <Switch
                        id="dailyReports"
                        checked={notificationSettings.dailyReports}
                        onCheckedChange={() => handleNotificationToggle("dailyReports")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weeklyReports" className="font-medium">
                          Weekly Reports
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
                      </div>
                      <Switch
                        id="weeklyReports"
                        checked={notificationSettings.weeklyReports}
                        onCheckedChange={() => handleNotificationToggle("weeklyReports")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="monthlyReports" className="font-medium">
                          Monthly Reports
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive monthly summary reports</p>
                      </div>
                      <Switch
                        id="monthlyReports"
                        checked={notificationSettings.monthlyReports}
                        onCheckedChange={() => handleNotificationToggle("monthlyReports")}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system behavior and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cameraRefreshRate">Camera Refresh Rate (seconds)</Label>
                      <Input
                        id="cameraRefreshRate"
                        name="cameraRefreshRate"
                        type="number"
                        min="1"
                        max="60"
                        value={systemSettings.cameraRefreshRate}
                        onChange={(e) => setSystemSettings((prev) => ({ ...prev, cameraRefreshRate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataRetentionPeriod">Data Retention Period (days)</Label>
                      <Input
                        id="dataRetentionPeriod"
                        name="dataRetentionPeriod"
                        type="number"
                        min="1"
                        value={systemSettings.dataRetentionPeriod}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({ ...prev, dataRetentionPeriod: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Maintenance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Backup Frequency</Label>
                      <Select
                        value={systemSettings.backupFrequency}
                        onValueChange={(value) => handleSelectChange("system", "backupFrequency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceWindow">Maintenance Window</Label>
                      <Select
                        value={systemSettings.maintenanceWindow}
                        onValueChange={(value) => handleSelectChange("system", "maintenanceWindow", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="analyticsEnabled" className="font-medium">
                          Analytics
                        </Label>
                        <p className="text-sm text-muted-foreground">Enable advanced analytics</p>
                      </div>
                      <Switch
                        id="analyticsEnabled"
                        checked={systemSettings.analyticsEnabled}
                        onCheckedChange={() => handleSystemToggle("analyticsEnabled")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="debugMode" className="font-medium">
                          Debug Mode
                        </Label>
                        <p className="text-sm text-muted-foreground">Enable detailed logging</p>
                      </div>
                      <Switch
                        id="debugMode"
                        checked={systemSettings.debugMode}
                        onCheckedChange={() => handleSystemToggle("debugMode")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="apiAccess" className="font-medium">
                          API Access
                        </Label>
                        <p className="text-sm text-muted-foreground">Enable external API access</p>
                      </div>
                      <Switch
                        id="apiAccess"
                        checked={systemSettings.apiAccess}
                        onCheckedChange={() => handleSystemToggle("apiAccess")}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Users & Permissions</CardTitle>
                <CardDescription>Manage user accounts and access control</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>User management functionality will be implemented here.</p>
                  <Button variant="outline">Add User</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>Manage your subscription and payment methods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>Billing management functionality will be implemented here.</p>
                  <Button variant="outline">Manage Subscription</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

