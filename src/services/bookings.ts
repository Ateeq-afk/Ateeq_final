// src/services/bookings.ts
import { supabase } from '@/lib/supabaseClient'
import type { Booking } from '../types'

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
