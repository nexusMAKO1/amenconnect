"use client"

import React, { useState, useRef, ChangeEvent } from "react"
import { IonIcon, useIonToast } from "@ionic/react"
import { imageOutline, cloudUploadOutline, trashOutline } from "ionicons/icons"

interface LogoUploaderProps {
  currentLogo?: string
  onLogoChange: (logoUrl: string | null) => void
  className?: string
}

export default function LogoUploader({ currentLogo, onLogoChange, className = "" }: LogoUploaderProps) {
  const [presentToast] = useIonToast()
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo || null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|svg\+xml)/i)) {
      presentToast({
        message: "Format de fichier non supporté. Veuillez utiliser JPG, PNG, GIF ou SVG.",
        duration: 3000,
        position: "top",
        color: "warning",
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      presentToast({
        message: "Le fichier est trop volumineux. La taille maximale est de 2MB.",
        duration: 3000,
        position: "top",
        color: "warning",
      })
      return
    }

    // Create a preview immediately using FileReader
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload the file to the Node API endpoint
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("logo", file)

      const response = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      // data.logoUrl should contain the URL to the logo stored in /public/uploads
      onLogoChange(data.logoUrl)
      setPreviewUrl(data.logoUrl)
      presentToast({
        message: "Logo téléchargé avec succès.",
        duration: 2500,
        position: "top",
        color: "success",
      })
    } catch (error) {
      console.error("Error uploading logo:", error)
      presentToast({
        message: "Une erreur est survenue lors du téléchargement du logo.",
        duration: 3000,
        position: "top",
        color: "danger",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleRemoveLogo = () => {
    setPreviewUrl(null)
    onLogoChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={`logo-uploader ${className}`}>
      <div className="logo-uploader-header">
        <h3 className="logo-uploader-title">
          <IonIcon icon={imageOutline} />
          Logo de l'Application
        </h3>
      </div>

      <div
        className={`logo-uploader-dropzone ${isDragging ? "dragging" : ""} ${isUploading ? "uploading" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <div className="logo-preview-container">
            <img src={previewUrl || "/placeholder.svg"} alt="Logo" className="logo-preview" />
            <button
              className="logo-remove-button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveLogo()
              }}
              title="Supprimer le logo"
            >
              <IonIcon icon={trashOutline} />
            </button>
          </div>
        ) : (
          <div className="logo-upload-placeholder">
            <IonIcon icon={cloudUploadOutline} className="upload-icon" />
            <p>Glissez-déposez votre logo ici ou cliquez pour parcourir</p>
            <span className="upload-hint">PNG, JPG, GIF ou SVG (max. 2MB)</span>
            {isUploading && <div className="upload-spinner"></div>}
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="file-input"
          accept="image/jpeg,image/png,image/gif,image/svg+xml"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
              handleFileChange(e.target.files[0])
            }
          }}
        />
      </div>
    </div>
  )
}
