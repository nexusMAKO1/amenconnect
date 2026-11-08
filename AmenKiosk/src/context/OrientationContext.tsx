"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo } from "react"

type Orientation = "portrait" | "landscape"

interface OrientationContextType {
  orientation: Orientation
  isPortrait: boolean
  isLandscape: boolean
}

const OrientationContext = createContext<OrientationContextType>({
  orientation: "portrait",
  isPortrait: true,
  isLandscape: false,
})

export const useOrientation = () => useContext(OrientationContext)

export const OrientationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orientation, setOrientation] = useState<Orientation>("portrait")

  useEffect(() => {
    const updateOrientation = () => {
      if (window.matchMedia("(orientation: portrait)").matches) {
        setOrientation("portrait")
      } else {
        setOrientation("landscape")
      }
    }

    // Set initial orientation
    updateOrientation()

    // Add event listener for orientation changes
    window.addEventListener("resize", updateOrientation)
    window.addEventListener("orientationchange", updateOrientation)

    return () => {
      window.removeEventListener("resize", updateOrientation)
      window.removeEventListener("orientationchange", updateOrientation)
    }
  }, [])

  const value = useMemo<OrientationContextType>(
    () => ({
      orientation,
      isPortrait: orientation === "portrait",
      isLandscape: orientation === "landscape",
    }),
    [orientation]
  )

  return <OrientationContext.Provider value={value}>{children}</OrientationContext.Provider>
}

