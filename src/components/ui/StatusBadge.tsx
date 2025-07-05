import React from 'react'
import { Badge } from './badge'
import type { Booking } from '../../types'

export default function StatusBadge({ status }: { status: Booking['status'] }) {
  const statusConfig: Record<Booking['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'neutral'; label: string }> = {
    booked: { variant: 'warning', label: 'Booked' },
    in_transit: { variant: 'info', label: 'In Transit' },
    unloaded: { variant: 'secondary', label: 'Unloaded' },
    out_for_delivery: { variant: 'warning', label: 'Out for Delivery' },
    delivered: { variant: 'success', label: 'Delivered' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
    pod_received: { variant: 'neutral', label: 'POD Received' },
  }

  const config = statusConfig[status]
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}