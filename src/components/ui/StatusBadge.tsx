import React from 'react'
import type { Booking } from '../../types'

export default function StatusBadge({ status }: { status: Booking['status'] }) {
  const colors: Record<Booking['status'], string> = {
    booked: 'bg-yellow-100 text-yellow-800',
    in_transit: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  // Capitalize each word (e.g. “in_transit” → “In Transit”)
  const label = status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        colors[status]
      }`}
    >
      {label}
    </span>
  )
}
