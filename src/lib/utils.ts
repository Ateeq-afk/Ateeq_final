import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple toast utility for now - replace with proper toast library later
export const toast = {
  success: (message: string) => {
    console.log('SUCCESS:', message);
    // For now, just log. In production, implement proper toast notifications
  },
  error: (message: string) => {
    console.error('ERROR:', message);
    // For now, just log. In production, implement proper toast notifications
  }
}