import type React from "react"
import { isPlatform } from "@ionic/react"
import AccueilMobile from "./AccueilMobile"
import AccueilDesktop from "./AccueilDesktop"
import AccueilKiosk from "./AccueilKiosk"
import { useEffect, useState } from "react"

const Accueil: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(window.matchMedia("(orientation: portrait)").matches)
  const [isTouchable, setIsTouchable] = useState(false)
  const isMobile = isPlatform("mobile")

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.matchMedia("(orientation: portrait)").matches)
    }

    // Check touch support
    setIsTouchable("ontouchstart" in window || navigator.maxTouchPoints > 0)

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Detect if it's a borne interactive (not mobile, portrait, and touch screen)
  const isBorneInteractive = !isMobile && isPortrait 

  return (
    <>
      {isMobile ? (
        <AccueilMobile />
      ) : isBorneInteractive ? (
        <AccueilKiosk />
      ) : (
        <AccueilDesktop />
      )}
    </>
  )
}

export default Accueil
