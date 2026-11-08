"use client";
import { useState, useEffect } from "react";
import type React from "react";
import { IonIcon } from "@ionic/react";
import {
  calendarOutline,
  walletOutline,
  personOutline,
  cashOutline,
  repeatOutline,
  timeOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { useAuth } from "../../../AuthContext";
import useVirementProgramme from "../../../hooks/useVirementProgramme";
import { useBeneficiaries } from "../../../hooks/useBeneficiaries";

interface Compte {
  _id: string;
  numéroCompte: string;
  solde: number;
  type: string;
}

const VirementsProgrammes: React.FC = () => {
  const { profile } = useAuth();
  const [comptes, setComptes] = useState<Compte[]>([]);
  const {
    beneficiaires,
    loading: beneficiariesLoading,
    error: beneficiariesError,
  } = useBeneficiaries();
  const [compteSource, setCompteSource] = useState("");
  const [beneficiaire, setBeneficiaire] = useState("");
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [frequence, setFrequence] = useState("mensuel");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Use the virement programme hook
  const { loading, error: hookError, response, makeVirementProgramme } = useVirementProgramme();

  useEffect(() => {
    // Set default dates
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);
    setDateDebut(today.toISOString().split("T")[0]);
    setDateFin(nextYear.toISOString().split("T")[0]);

    // Fetch accounts from profile
    if (profile && profile.comptes) {
      setComptes(profile.comptes);
      if (profile.comptes.length > 0) {
        setCompteSource(profile.comptes[0]._id);
      }
    }
  }, [profile]);

  // When beneficiaries load, select the first one by default
  useEffect(() => {
    if (beneficiaires.length > 0) {
      setBeneficiaire(beneficiaires[0]._id);
    }
  }, [beneficiaires]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setSuccess(false);

    // Basic validations
    if (!compteSource || !beneficiaire || !montant || !dateDebut || !dateFin || !frequence) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const numMontant = Number.parseFloat(montant);
    if (isNaN(numMontant) || numMontant <= 0) {
      setError("Le montant doit être supérieur à 0 TND");
      return;
    }

    const selected = comptes.find((compte) => compte._id === compteSource);
    if (selected && numMontant > selected.solde) {
      setError(`Solde insuffisant pour la première échéance (Solde disponible: ${formatCurrency(selected.solde)})`);
      return;
    }

    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);
    if (startDate >= endDate) {
      setError("La date de fin doit être postérieure à la date de début");
      return;
    }

    // Prepare payload for the scheduled virement
    const payload = {
      fromAccount: compteSource,
      toAccount: beneficiaire,
      amount: Number.parseFloat(montant),
      description: motif,
      frequency: frequence as "quotidien" | "hebdomadaire" | "mensuel" | "trimestriel" | "annuel",
      startDate: dateDebut,
      endDate: dateFin,
    };

    await makeVirementProgramme(payload);

    if (response?.success) {
      setMontant("");
      setMotif("");
      setSuccess(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getFrequenceLabel = (freq: string) => {
    switch (freq) {
      case "quotidien":
        return "Quotidienne";
      case "hebdomadaire":
        return "Hebdomadaire";
      case "mensuel":
        return "Mensuelle";
      case "trimestriel":
        return "Trimestrielle";
      case "annuel":
        return "Annuelle";
      default:
        return freq;
    }
  };

  const calculateOccurrences = () => {
    if (!dateDebut || !dateFin || !frequence) return 0;

    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (frequence) {
      case "quotidien":
        return diffDays;
      case "hebdomadaire":
        return Math.floor(diffDays / 7);
      case "mensuel":
        return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
      case "trimestriel":
        return Math.floor(((end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth()) / 3);
      case "annuel":
        return end.getFullYear() - start.getFullYear();
      default:
        return 0;
    }
  };

  const selectedCompte = comptes.find((compte) => compte._id === compteSource);
  // Note: Adjust the displayed beneficiary fields based on your beneficiary model.
  const selectedBeneficiaire = beneficiaires.find((ben) => ben._id === beneficiaire);
  const occurrences = calculateOccurrences();
  const totalAmount = occurrences * Number.parseFloat(montant || "0");

  return (
    <div className="virements-programmes">
      <div className="virement-grid virement-grid--2cols">
        <div className="virement-card">
          <h3 className="virement-card__title">
            <IonIcon icon={calendarOutline} />
            Programmer un virement
          </h3>

          {success && (
            <div className="virement-success">
              <div className="virement-success__icon">
                <IonIcon icon={checkmarkCircleOutline} />
              </div>
              <h4 className="virement-success__title">Virement programmé avec succès</h4>
              <p className="virement-success__message">
                Votre virement programmé a été enregistré et les fonds ont été réservés. Vous recevrez un email de confirmation.
              </p>
              <button className="virement-form__button" onClick={() => setSuccess(false)}>
                Programmer un autre virement
              </button>
            </div>
          )}

          {!success && (
            <form className="virement-form" onSubmit={handleSubmit}>
              {(error || hookError) && <div className="virement-form__error">{error || hookError}</div>}

              <div className="virement-form__group">
                <label className="virement-form__label" htmlFor="compteSource">
                  Compte source
                </label>
                <select
                  id="compteSource"
                  className="virement-form__select"
                  value={compteSource}
                  onChange={(e) => setCompteSource(e.target.value)}
                  required
                >
                  {comptes.map((compte) => (
                    <option key={compte._id} value={compte._id}>
                      {compte.type} - {compte.numéroCompte} ({formatCurrency(compte.solde)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="virement-form__group">
                <label className="virement-form__label" htmlFor="beneficiaire">
                  Bénéficiaire
                </label>
                <select
                  id="beneficiaire"
                  className="virement-form__select"
                  value={beneficiaire}
                  onChange={(e) => setBeneficiaire(e.target.value)}
                  required
                >
                  {beneficiaires.map((ben) => (
                    <option key={ben._id} value={ben._id}>
                      {ben.prenom} {ben.nom} - {ben.RIB}
                    </option>
                  ))}
                </select>
              </div>

              <div className="virement-form__group">
                <label className="virement-form__label" htmlFor="montant">
                  Montant (TND)
                </label>
                <input
                  id="montant"
                  type="number"
                  className="virement-form__input"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="virement-form__group">
                <label className="virement-form__label" htmlFor="motif">
                  Motif du virement
                </label>
                <textarea
                  id="motif"
                  className="virement-form__textarea"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="virement-form__group">
                <label className="virement-form__label" htmlFor="frequence">
                  Fréquence
                </label>
                <select
                  id="frequence"
                  className="virement-form__select"
                  value={frequence}
                  onChange={(e) => setFrequence(e.target.value)}
                  required
                >
                  <option value="quotidien">Quotidienne</option>
                  <option value="hebdomadaire">Hebdomadaire</option>
                  <option value="mensuel">Mensuelle</option>
                  <option value="trimestriel">Trimestrielle</option>
                  <option value="annuel">Annuelle</option>
                </select>
              </div>

              <div className="virement-form__row">
                <div className="virement-form__group">
                  <label className="virement-form__label" htmlFor="dateDebut">
                    Date de début
                  </label>
                  <input
                    id="dateDebut"
                    type="date"
                    className="virement-form__input"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="virement-form__group">
                  <label className="virement-form__label" htmlFor="dateFin">
                    Date de fin
                  </label>
                  <input
                    id="dateFin"
                    type="date"
                    className="virement-form__input"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    min={dateDebut}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="virement-form__button" disabled={loading}>
                {loading ? "Traitement en cours..." : "Programmer le virement"}
              </button>
            </form>
          )}
        </div>

        <div className="virement-card">
          <h3 className="virement-card__title">
            <IonIcon icon={repeatOutline} />
            Résumé du virement programmé
          </h3>

          <div className="virement-recap">
            <div className="virement-recap__group">
              <h4 className="virement-recap__title">
                <IonIcon icon={walletOutline} />
                Compte source
              </h4>
              {selectedCompte ? (
                <div className="virement-recap__content">
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">Type:</span>
                    <span className="virement-recap__value">{selectedCompte.type}</span>
                  </div>
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">Numéro:</span>
                    <span className="virement-recap__value">{selectedCompte.numéroCompte}</span>
                  </div>
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">Solde disponible:</span>
                    <span className="virement-recap__value">{formatCurrency(selectedCompte.solde)}</span>
                  </div>
                </div>
              ) : (
                <p className="virement-recap__empty">Aucun compte sélectionné</p>
              )}
            </div>

            <div className="virement-recap__group">
              <h4 className="virement-recap__title">
                <IonIcon icon={personOutline} />
                Bénéficiaire
              </h4>
              {selectedBeneficiaire ? (
                <div className="virement-recap__content">
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">Nom:</span>
                    <span className="virement-recap__value">
                      {selectedBeneficiaire.prenom} {selectedBeneficiaire.nom}
                    </span>
                  </div>
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">Compte:</span>
                    <span className="virement-recap__value">{selectedBeneficiaire.RIB}</span>
                  </div>
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">Banque:</span>
                    <span className="virement-recap__value">{selectedBeneficiaire.banque}</span>
                  </div>
                </div>
              ) : (
                <p className="virement-recap__empty">Aucun bénéficiaire sélectionné</p>
              )}
            </div>

            <div className="virement-recap__group">
              <h4 className="virement-recap__title">
                <IonIcon icon={cashOutline} />
                Détails du virement
              </h4>
              <div className="virement-recap__content">
                <div className="virement-recap__item">
                  <span className="virement-recap__label">Montant par virement:</span>
                  <span className="virement-recap__value">
                    {montant ? formatCurrency(Number.parseFloat(montant)) : "0,00 TND"}
                  </span>
                </div>
                <div className="virement-recap__item">
                  <span className="virement-recap__label">Motif:</span>
                  <span className="virement-recap__value">{motif || "Non spécifié"}</span>
                </div>
              </div>
            </div>

            <div className="virement-recap__group">
              <h4 className="virement-recap__title">
                <IonIcon icon={timeOutline} />
                Programmation
              </h4>
              <div className="virement-recap__content">
                <div className="virement-recap__item">
                  <span className="virement-recap__label">Fréquence:</span>
                  <span className="virement-recap__value">{getFrequenceLabel(frequence)}</span>
                </div>
                <div className="virement-recap__item">
                  <span className="virement-recap__label">Date de début:</span>
                  <span className="virement-recap__value">{formatDate(dateDebut)}</span>
                </div>
                <div className="virement-recap__item">
                  <span className="virement-recap__label">Date de fin:</span>
                  <span className="virement-recap__value">{formatDate(dateFin)}</span>
                </div>
                <div className="virement-recap__item">
                  <span className="virement-recap__label">Nombre d'occurrences:</span>
                  <span className="virement-recap__value">{occurrences}</span>
                </div>
                <div className="virement-recap__item">
                  <span className="virement-recap__label">Montant total:</span>
                  <span className="virement-recap__value">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirementsProgrammes;
