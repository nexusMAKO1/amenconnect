"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { IonIcon, useIonToast } from "@ionic/react"
import { arrowBack } from "ionicons/icons"
import "./AccountCreationForm.css"
import type { FormData, SignatureCanvasRef } from "./../components/accountcreationform/types"
import Page1Component from "./../components/accountcreationform/page1-component"
import Page2Component from "./../components/accountcreationform/page2-component"
import Page3Component from "./../components/accountcreationform/page3-component"
import Page4Component from "./../components/accountcreationform/page4-component"
import SignatureCanvas from "react-signature-canvas"

interface AccountCreationFormProps {
  onBack: () => void
  resetTimer?: () => void
}

const AccountCreationForm: React.FC<AccountCreationFormProps> = ({ onBack, resetTimer }) => {
  const [presentToast] = useIonToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    prenom: "",
    dateNaissance: "",
    lieuNaissance: "",
    numeroCIN: "",
    dateDelivranceCIN: "",
    lieuDelivranceCIN: "",
    qualiteJuridique: "",
    situationFamille: "Célibataire",
    email: "",
    numeroGSM: "",
    adresseDomicile: "",
    codePostal: "2080",
    ville: "ARIANA",

    // Activity
    activite: "Elève/étudiant",
    fonction: "Neant",

    // FATCA
    fatca: "non",
    citoyenneteAmericaine: "NON",
    pays: "TUN TUNISIENNE",
    detentionCodeTIN: "NON",
    codeTIN: "",
    ligneTelephoniqueUSA: "NON",
    detentionGreenCard: "NON",
    adressePostaleUSA: "NON",
    virementPermanentUSA: "NON",
    procurationPersonneUSA: "NON",
    detentionSocieteAmericaine: "NON",

    // Page 2
    connuAmenBank: "Internet",
    connuAmenBankAutre: "",

    // Special functions
    exerceHauteFonction: "NON",
    exerceHauteFonctionDetail: {
      fonction: "",
      organisme: "",
    },
    liePersonneHauteFonction: "NON",
    liePersonneHauteFonctionDetail: {
      fonction: "",
      organisme: "",
      nomPrenom: "",
    },
    fonctionnaireOrganisationInternationale: "NON",
    fonctionnaireOrganisationInternationaleDetail: {
      fonction: "",
      organisme: "",
    },

    // Revenue types
    revenusTypes: {
      salaires: false,
      honoraires: false,
      loyers: false,
      pensions: false,
      revenusAvoirs: false,
      autres: false,
    },
    montantRevenusAnnuels: "",
    montantRevenusMensuels: "",

    // Business Relationship
    objetOuvertureCompte: {
      domiciliationSalaires: false,
      placements: false,
      investissementsMarchesFinanciers: false,
      credits: false,
      activiteCommerciale: false,
      autre: false,
    },
    objetOuvertureCompteAutre: "",

    // Planned transactions
    transactionsEnvisagees: {
      operationsCourantes: false,
      transfertsCommerciaux: false,
      transfertsFinanciers: false,
      epargneDepot: false,
      credits: false,
      titres: false,
    },
    volumeMensuelTransaction: "",

    // Page 3 - Products and Services
    typeCompte: "Compte de dépot",
    agenceContact: "AGENCE AIN ZAGHOUAN",
    acceptConditions: false,
    wantCreditCard: false, // initialize as false
    creditCardType: "",    // initialize as empty string
    // Page 4 - Verification and Validation
    documentsValides: false,

    // Document upload
    cinRecto: null,
    cinVerso: null,
    specimenSignature: null,
    ficheProfilClient: null,
    selfiAvecCIN: null
  })

  const [penColor, setPenColor] = useState("#000000")
  const [penSize, setPenSize] = useState(2)
  const [showSignatureTools, setShowSignatureTools] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<string[]>([])

  // Update the ref declaration to use the correct type
  const signatureCanvasRef = useRef<SignatureCanvasRef>(null)
  const signatureAreaRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Add event listeners to reset the inactivity timer
  useEffect(() => {
    const formElement = formRef.current

    if (formElement && resetTimer) {
      // Function to reset timer on any interaction with the form
      const handleFormInteraction = () => {
        resetTimer()
      }

      // Add event listeners for common form interactions
      formElement.addEventListener("click", handleFormInteraction)
      formElement.addEventListener("input", handleFormInteraction)
      formElement.addEventListener("change", handleFormInteraction)
      formElement.addEventListener("keydown", handleFormInteraction)
      formElement.addEventListener("touchstart", handleFormInteraction)

      // Clean up event listeners on unmount
      return () => {
        formElement.removeEventListener("click", handleFormInteraction)
        formElement.removeEventListener("input", handleFormInteraction)
        formElement.removeEventListener("change", handleFormInteraction)
        formElement.removeEventListener("keydown", handleFormInteraction)
        formElement.removeEventListener("touchstart", handleFormInteraction)
      }
    }
  }, [resetTimer])

  // Update canvas size on window resize
  useEffect(() => {
    const handleResize = () => {
      if (signatureCanvasRef.current && signatureAreaRef.current) {
        const canvas = signatureCanvasRef.current.getCanvas()
        const container = signatureAreaRef.current
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    window.addEventListener("resize", handleResize)
    // Initial setup
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Initialize SignatureCanvas on window object for client-side rendering
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.SignatureCanvas = SignatureCanvas
    }
  }, [])

  // Check if signature exists after each stroke
  const handleSignatureChange = () => {
    if (resetTimer) resetTimer();
  
    if (signatureCanvasRef.current) {
      const isEmpty = signatureCanvasRef.current.isEmpty();
      setHasSignature(!isEmpty);
  
      if (!isEmpty) {
        // Instead of getTrimmedCanvas(), use getCanvas()
        const dataUrl = signatureCanvasRef.current.getCanvas().toDataURL("image/png");
        setSignaturePreview(dataUrl);
      } else {
        setSignaturePreview(null);
      }
    }
  };
  

  const clearSignature = () => {
    // Reset inactivity timer when signature is cleared
    if (resetTimer) resetTimer()

    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear()
      setHasSignature(false)
      setSignaturePreview(null)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    // Reset inactivity timer on input change
    if (resetTimer) resetTimer()

    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleNestedInputChange = (category: keyof FormData, field: string, value: string) => {
    // Reset inactivity timer on nested input change
    if (resetTimer) resetTimer()

    // Fix for spread types error - use type assertion to ensure TypeScript knows it's an object
    const currentValue = formData[category] as Record<string, any>

    setFormData({
      ...formData,
      [category]: {
        ...currentValue,
        [field]: value,
      },
    })
  }

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset inactivity timer on radio change
    if (resetTimer) resetTimer()

    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset inactivity timer on checkbox change
    if (resetTimer) resetTimer();
  
    const { name, checked } = e.target;
  
    if (name.includes(".")) {
      const [category, field] = name.split(".");
      const currentValue = formData[category as keyof FormData] as Record<string, any>;
  
      setFormData({
        ...formData,
        [category]: {
          ...currentValue,
          [field]: checked,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: checked,
      });
    }
  };

  const validatePage1 = () => {
    const errors: string[] = []

    // Check required fields on page 1
    if (!formData.nom) errors.push("Le nom est requis")
    if (!formData.prenom) errors.push("Le prénom est requis")
    if (!formData.dateNaissance) errors.push("La date de naissance est requise")
    if (!formData.lieuNaissance) errors.push("Le lieu de naissance est requis")
    if (!formData.numeroCIN) errors.push("Le numéro CIN est requis")
    if (!formData.dateDelivranceCIN) errors.push("La date de délivrance CIN est requise")
    if (!formData.lieuDelivranceCIN) errors.push("Le lieu de délivrance CIN est requis")
    if (!formData.situationFamille) errors.push("La situation de famille est requise")
    if (!formData.email) errors.push("L'email est requis")
    if (!formData.numeroGSM) errors.push("Le numéro de GSM est requis")
    if (!formData.adresseDomicile) errors.push("L'adresse domicile est requise")

    setFormErrors(errors)
    return errors.length === 0
  }

  const validatePage2 = () => {
    const errors: string[] = []

    // Check required fields for page 2
    if (!formData.connuAmenBank) errors.push("Comment avez-vous connu AMEN FIRST BANK est requis")

    // Check if at least one revenue type is selected
    const hasRevenueType = Object.values(formData.revenusTypes).some((value) => value)
    if (!hasRevenueType) errors.push("Au moins un type de revenu doit être sélectionné")

    if (!formData.montantRevenusAnnuels) errors.push("Le montant approximatif des revenus annuels est requis")

    // Check if at least one business relationship object is selected
    const hasBusinessRelationship = Object.values(formData.objetOuvertureCompte).some((value) => value)
    if (!hasBusinessRelationship) errors.push("Au moins un objet d'ouverture de compte doit être sélectionné")

    // Check if at least one transaction type is selected
    const hasTransaction = Object.values(formData.transactionsEnvisagees).some((value) => value)
    if (!hasTransaction) errors.push("Au moins un type de transaction envisagée doit être sélectionné")

    if (!formData.volumeMensuelTransaction) errors.push("Le volume mensuel de transaction est requis")

    setFormErrors(errors)
    return errors.length === 0
  }

  const validatePage3 = () => {
    const errors: string[] = []

    // Check required fields for page 3
    if (!formData.typeCompte) errors.push("Le type de compte est requis")
    if (!formData.agenceContact) errors.push("L'agence de contact est requise")
    if (!formData.acceptConditions) errors.push("Vous devez accepter les conditions")

    setFormErrors(errors)
    return errors.length === 0
  }

  const validatePage4 = () => {
    const errors: string[] = []

    // Check required fields for page 4
    if (!formData.documentsValides) errors.push("Vous devez valider vos informations personnelles")
    if (!formData.cinRecto) errors.push("La carte d'identité nationale (Recto) est requise")
    if (!formData.cinVerso) errors.push("La carte d'identité nationale (Verso) est requise")
    if (!formData.specimenSignature) errors.push("Le spécimen de signature est requis")
    if (!formData.ficheProfilClient) errors.push("La fiche profil client est requise")
    if (!formData.selfiAvecCIN) errors.push("Le selfi avec la carte d'identité nationale est requis")

    if (!hasSignature) errors.push("Veuillez signer le document")

    setFormErrors(errors)
    return errors.length === 0
  }

  const goToNextPage = () => {
    // Reset inactivity timer when navigating to next page
    if (resetTimer) resetTimer()

    if (currentPage === 1) {
      if (validatePage1()) {
        setCurrentPage(2)
        setFormErrors([])
        window.scrollTo(0, 0)
      }
    } else if (currentPage === 2) {
      if (validatePage2()) {
        setCurrentPage(3)
        setFormErrors([])
        window.scrollTo(0, 0)
      }
    } else if (currentPage === 3) {
      if (validatePage3()) {
        setCurrentPage(4)
        setFormErrors([])
        window.scrollTo(0, 0)
      }
    }
  }

  const goToPreviousPage = () => {
    // Reset inactivity timer when navigating to previous page
    if (resetTimer) resetTimer()

    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      setFormErrors([])
      window.scrollTo(0, 0)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset inactivity timer when file is selected
    if (resetTimer) resetTimer()

    const { name, files } = e.target
    if (files && files.length > 0) {
      setFormData({
        ...formData,
        [name]: files[0],
      })
    }
  }
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });  

    const handleSubmit = async (e: React.FormEvent) => {
      if (resetTimer) resetTimer();
      e.preventDefault();
    
      // Validate based on current page
      if (currentPage === 1 && !validatePage1()) return;
      if (currentPage === 2 && !validatePage2()) return;
      if (currentPage === 3 && !validatePage3()) return;
      if (currentPage === 4 && !validatePage4()) return;
    
      // Get signature as a data URL
      const signatureDataUrl = signatureCanvasRef.current?.getCanvas().toDataURL("image/png");
    
      // Create a copy of formData and add the signature
      const updatedFormData: any = {
        ...formData,
        specimenSignature: signatureDataUrl,
      };
      console.log("Submitting form data:", formData);
      // Define the file fields that need to be converted
      const fileFields = ["cinRecto", "cinVerso", "ficheProfilClient", "selfiAvecCIN"];
    
      // Convert each file field to a base64 string if it's a File object
      for (const field of fileFields) {
        const fileValue = formData[field as keyof FormData];
        if (fileValue instanceof File) {
          try {
            const base64String = await fileToBase64(fileValue);
            updatedFormData[field] = base64String;
          } catch (error) {
            console.error(`Error converting file ${field}:`, error);
          }
        }
      }
    
      try {
        const response = await fetch("/api/account-creation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedFormData),
        });
    
        if (response.ok) {
          const data = await response.json();
          presentToast({
            message: data.message || "Votre demande a été soumise avec succès. Nous vous contacterons bientôt.",
            duration: 3500,
            color: "success",
            position: "top",
          });
          onBack();
        } else {
          const errorData = await response.json();
          presentToast({
            message: "Erreur: " + errorData.error,
            duration: 3500,
            color: "danger",
            position: "top",
          });
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        presentToast({
          message: "Une erreur est survenue lors de l'envoi de la demande",
          duration: 3500,
          color: "danger",
          position: "top",
        });
      }
    };
    
  

  const toggleSignatureTools = () => {
    // Reset inactivity timer when signature tools are toggled
    if (resetTimer) resetTimer()

    setShowSignatureTools(!showSignatureTools)
  }

  const handlePenColorChange = (color: string) => {
    // Reset inactivity timer when pen color is changed
    if (resetTimer) resetTimer()

    setPenColor(color)
    if (signatureCanvasRef.current) {
      // Use type assertion to access the penColor property
      ;(signatureCanvasRef.current as any).penColor = color
    }
  }

  const handlePenSizeChange = (size: number) => {
    // Reset inactivity timer when pen size is changed
    if (resetTimer) resetTimer()

    setPenSize(size)
    if (signatureCanvasRef.current) {
      // Use type assertion to access the dotSize property
      ;(signatureCanvasRef.current as any).dotSize = size
    }
  }

  return (
    <div className="acf-container acf-animate-fade-in">
      <div className="acf-paper-content">
        <button className="acf-back-button" onClick={onBack}>
          <IonIcon icon={arrowBack} />
        </button>

        <div className="acf-paper-header">
          <div className="acf-bank-logo">
            <img src="/amen_logo.png?height=80&width=80" alt="Amen Bank Logo" />
          </div>
          <div className="acf-document-title">
            <h1>CONVENTION DE GESTION DE COMPTE</h1>
            <h2>PERSONNE PHYSIQUE</h2>
          </div>
        </div>

        {formErrors.length > 0 && (
          <div className="acf-error-container">
            <h4>Veuillez corriger les erreurs suivantes:</h4>
            <ul>
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="acf-pagination">
          <div className={`acf-page-indicator ${currentPage === 1 ? "acf-active" : ""}`}>
            <span className="acf-page-number">1</span>
            <span className="acf-page-label">Informations personnelles</span>
          </div>
          <div className="acf-page-line"></div>
          <div className={`acf-page-indicator ${currentPage === 2 ? "acf-active" : ""}`}>
            <span className="acf-page-number">2</span>
            <span className="acf-page-label">Informations complémentaires</span>
          </div>
          <div className="acf-page-line"></div>
          <div className={`acf-page-indicator ${currentPage === 3 ? "acf-active" : ""}`}>
            <span className="acf-page-number">3</span>
            <span className="acf-page-label">Produits et services</span>
          </div>
          <div className="acf-page-line"></div>
          <div className={`acf-page-indicator ${currentPage === 4 ? "acf-active" : ""}`}>
            <span className="acf-page-number">4</span>
            <span className="acf-page-label">Vérification et validation</span>
          </div>
        </div>

        <form className="acf-paper-form" onSubmit={handleSubmit} ref={formRef}>
          {currentPage === 1 && (
            <Page1Component
              formData={formData}
              handleInputChange={handleInputChange}
              handleRadioChange={handleRadioChange}
              formErrors={formErrors}
            />
          )}

          {currentPage === 2 && (
            <Page2Component
              formData={formData}
              handleInputChange={handleInputChange}
              handleRadioChange={handleRadioChange}
              handleCheckboxChange={handleCheckboxChange}
              handleNestedInputChange={handleNestedInputChange}
              formErrors={formErrors}
            />
          )}

          {currentPage === 3 && (
            <Page3Component
              formData={formData}
              handleInputChange={handleInputChange}
              handleCheckboxChange={handleCheckboxChange}
              formErrors={formErrors}
            />
          )}

{currentPage === 4 && (
  <Page4Component
    formData={formData}
    handleInputChange={handleInputChange}
    handleCheckboxChange={handleCheckboxChange}
    handleFileChange={handleFileChange}
    signatureCanvasRef={signatureCanvasRef}
    signatureAreaRef={signatureAreaRef}
    clearSignature={clearSignature}
    handleSignatureChange={handleSignatureChange}
    showSignatureTools={showSignatureTools}
    toggleSignatureTools={toggleSignatureTools}
    penColor={penColor}
    penSize={penSize}
    handlePenColorChange={handlePenColorChange}
    handlePenSizeChange={handlePenSizeChange}
    hasSignature={hasSignature}
    signaturePreview={signaturePreview}
    formErrors={formErrors}
    // Removed: handleCaptchaChange={handleCaptchaChange}
  />
)}



          <div className="acf-form-actions">
            {currentPage > 1 && (
              <button type="button" className="acf-back-btn" onClick={goToPreviousPage}>
                ← Précédent
              </button>
            )}
            {currentPage < 4 ? (
              <button type="button" className="acf-next-btn" onClick={goToNextPage}>
                Suivant →
              </button>
            ) : (
              <button type="submit" className="acf-submit-btn">
                Soumettre
              </button>
            )}
          </div>
        </form>

        <div className="acf-paper-footer">
          <span className="acf-footer-text">AMEN FIRST BANK © {new Date().getFullYear()}</span>
          <span>Ref: CGC-PP-{new Date().toISOString().split("T")[0]}</span>
        </div>
      </div>
    </div>
  )
}

export default AccountCreationForm

