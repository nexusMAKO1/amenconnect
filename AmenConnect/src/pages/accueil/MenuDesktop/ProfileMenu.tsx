"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { IonIcon, IonToggle } from "@ionic/react"
import { personOutline, settingsOutline, moonOutline, logOutOutline, chevronDown } from "ionicons/icons"
import "./ProfileMenu.css"
const ProfileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const toggleMenu = () => setIsOpen(!isOpen)

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [handleClickOutside]) // Added handleClickOutside to dependencies

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    // Implement your dark mode logic here
  }

  const handleLogout = () => {
    // Implement your logout logic here
    console.log("Logging out...")
  }

  return (
    <div className="profileD-menu-container" ref={menuRef}>
      <button className="profileD-button" onClick={toggleMenu}>
        Menu
        <IonIcon icon={chevronDown} />
      </button>
      {isOpen && (
        <div className="profileD-dropdown">
          <div className="profileD-dropdown-arrow"></div>
          <ul className="profileD-menu-list">
            <li>
              <a href="/profileD">
                <IonIcon icon={personOutline} />
                Voir le profil
              </a>
            </li>
            <li>
              <a href="/settings">
                <IonIcon icon={settingsOutline} />
                Gérer les paramètres
              </a>
            </li>
             {/*<li className="dark-mode-toggle">
              <IonIcon icon={moonOutline} />
              Mode sombre
              <IonToggle checked={isDarkMode} onIonChange={toggleDarkMode} className="dark-mode-switch" />
            </li>*/}
            <li className="logout-item" onClick={handleLogout}>
              <IonIcon icon={logOutOutline} />
              Déconnexion
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default ProfileMenu

