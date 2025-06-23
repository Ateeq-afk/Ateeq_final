// src/services/bookings.ts
import axios from 'axios'
import type { Booking } from '../types'

export async function fetchBookings(): Promise<Booking[]> {
  const { data } = await axios.get('/api/bookings')
  return data
}
