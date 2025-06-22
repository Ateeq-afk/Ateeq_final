/**
 * Utility functions for handling date fields in forms
 */

/**
 * Converts empty strings to null for date fields
 * This prevents database errors when submitting forms with empty date fields
 * 
 * @param value The date string value from a form field
 * @returns The original string if valid, or null if empty
 */
export function cleanDateField(value: string | undefined): string | null {
  if (!value || value.trim() === '') {
    return null;
  }
  return value;
}

/**
 * Formats a date string to a human-readable format
 * 
 * @param dateString The ISO date string to format
 * @param format The format to use (default: 'short')
 * @returns Formatted date string
 */
export function formatDate(dateString: string | null | undefined, format: 'short' | 'long' = 'short'): string {
  if (!dateString) return 'Not specified';
  
  try {
    const date = new Date(dateString);
    
    if (format === 'long') {
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Checks if a date is in the past
 * 
 * @param dateString The ISO date string to check
 * @returns True if the date is in the past, false otherwise
 */
export function isDateInPast(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date < today;
  } catch (error) {
    return false;
  }
}