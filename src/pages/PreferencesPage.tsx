import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useBranches } from '@/hooks/useBranches'

const formSchema = z.object({
  default_branch: z.string().optional(),
  date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY']).default('DD/MM/YYYY'),
  theme: z.enum(['light', 'dark']).default('light'),
  email_notifications: z.boolean().default(true),
  currency: z.enum(['INR', 'USD']).default('INR')
})

export type Preferences = z.infer<typeof formSchema>

export default function PreferencesPage() {
  const { user } = useAuth()
  const { branches } = useBranches()

  const { setValue, watch } = useForm<Preferences>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date_format: 'DD/MM/YYYY',
      theme: 'light',
      email_notifications: true,
      currency: 'INR'
    }
  })

  useEffect(() => {
    async function loadPreferences() {
      if (!user) return
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) {
        for (const key of Object.keys(data)) {
          if (key in data) {
            setValue(key as keyof Preferences, data[key])
          }
        }
      }
    }
    loadPreferences()
  }, [user, setValue])

  const updatePref = async (updates: Partial<Preferences>) => {
    if (!user) return
    await supabase
      .from('user_preferences')
      .upsert(
        { user_id: user.id, ...updates },
        { onConflict: ['user_id'] }
      )
  }

  const prefs = watch()

  useEffect(() => {
    updatePref(prefs)
  }, [prefs])

  return (
    <div className="space-y-8 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your basic settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default_branch">Default Branch</Label>
            <Select
              value={prefs.default_branch || ''}
              onValueChange={(val) => setValue('default_branch', val)}
            >
              <SelectTrigger id="default_branch">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} - {b.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select
              value={prefs.date_format}
              onValueChange={(val) => setValue('date_format', val as Preferences['date_format'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={prefs.theme}
              onValueChange={(val) => setValue('theme', val as Preferences['theme'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="email_notifications"
              checked={prefs.email_notifications}
              onCheckedChange={(val) => setValue('email_notifications', val)}
            />
            <Label htmlFor="email_notifications">Enable Email Notifications</Label>
          </div>
          <div className="space-y-2">
            <Label>Preferred Currency</Label>
            <Select
              value={prefs.currency}
              onValueChange={(val) => setValue('currency', val as Preferences['currency'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Getting Started with DesiCargo</CardTitle>
          <CardDescription>A quick guide to help you manage your logistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Welcome to DesiCargo! Here's how to get started:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Go to <strong>Bookings</strong> and click <em>+ New Booking</em></li>
            <li>Fill LR number, sender/receiver info, source and destination</li>
            <li>Add freight/handling amounts and set payment type</li>
            <li>Click <strong>Create</strong> and track your booking live!</li>
            <li>Use <strong>Loading</strong> / <strong>Unloading</strong> to manage shipment stages</li>
            <li>View reports or export summaries anytime from <strong>Reports</strong></li>
          </ol>
          <p>Need help? Contact our support team or refer to the detailed documentation soon to be added here.</p>
        </CardContent>
      </Card>
    </div>
  )
}