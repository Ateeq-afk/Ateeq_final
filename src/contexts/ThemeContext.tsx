import React, { createContext, useContext, useEffect, useState } from 'react'
import { BroadcastChannel } from 'broadcast-channel'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
})

export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  
  // Create a broadcast channel for theme sync across tabs
  const [themeChannel] = useState(() => {
    if (typeof window !== 'undefined') {
      return new BroadcastChannel('theme-channel')
    }
    return null
  })

  const setTheme = (value: Theme) => {
    setThemeState(value)
    if (themeChannel) {
      themeChannel.postMessage(value)
    }
  }

  // Listen for theme changes from other tabs
  useEffect(() => {
    if (themeChannel) {
      themeChannel.onmessage = (msg: Theme) => {
        setThemeState(msg)
      }
      return () => {
        themeChannel.close()
      }
    }
  }, [themeChannel])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('theme', theme)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        theme === 'dark' ? '#1e293b' : '#ffffff'
      )
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}