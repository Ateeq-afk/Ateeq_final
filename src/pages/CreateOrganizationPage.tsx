import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { createOrganization } from '@/services/api'

export default function CreateOrganizationPage() {
  const [name, setName] = useState('')
  const [created, setCreated] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const org = await createOrganization(name)
    setCreated(org)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit}>
        <Card className="w-80 space-y-4 p-8">
          <h2 className="text-center text-xl font-bold">New Organization</h2>
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">Create</Button>
          {created && (
            <p className="pt-2 text-center text-sm">Created {created.code}</p>
          )}
        </Card>
      </form>
    </div>
  )
}
