const COUNTRY_CODE = "TN";
const BANK_CODE = "07"; // Code Banque Amen Bank en Tunisie
const AGENCY_CODE = "162"; // Code Agence par défaut
const DOMICILIATION = "Amen Bank - Agence Centrale (162)";

/**
 * Calcule le modulo 97 d'une grande chaîne numérique.
 */
function mod97(numStr) {
  let remainder = 0;
  for (let i = 0; i < numStr.length; i++) {
    remainder = (remainder * 10 + parseInt(numStr[i], 10)) % 97;
  }
  return remainder;
}

/**
 * Convertit une chaîne en chaîne numérique en remplaçant les lettres (A -> 10, B -> 11, …).
 */
function convertToNumeric(str) {
  let converted = "";
  for (const char of str.toUpperCase()) {
    if (/[A-Z]/.test(char)) {
      converted += (char.charCodeAt(0) - 55).toString();
    } else {
      converted += char;
    }
  }
  return converted;
}

/**
 * Calcule la clé de contrôle pour un RIB sans clé (18 chiffres).
 * La clé est calculée à l'aide de l'algorithme modulo 97 standard tunisien:
 * Clé = 97 - ((RIB18 * 100) % 97)
 */
function computeControlKey(ribWithoutControl) {
  if (!/^\d{18}$/.test(ribWithoutControl)) {
    throw new Error("Le RIB sans clé doit contenir exactement 18 chiffres.");
  }
  // En Tunisie, le calcul de la clé RIB s'effectue sur les 18 chiffres suivis de 00
  const remainder = mod97(ribWithoutControl + "00");
  const keyVal = 97 - remainder;
  const key = (keyVal === 97 ? 97 : keyVal).toString().padStart(2, "0");
  return key;
}

/**
 * Génère un numéro de compte unique à 13 chiffres conforme à la norme bancaire tunisienne.
 */
function generateAccountNumber() {
  let num = "";
  for (let i = 0; i < 13; i++) {
    num += Math.floor(Math.random() * 10).toString();
  }
  return num;
}

/**
 * Construit un RIB tunisien complet (20 chiffres).
 * Format: Code Banque (2) + Code Agence (3) + Numéro de Compte (13) + Clé Contrôle (2)
 */
function buildCompleteRIB(accountNumber, bankCode = BANK_CODE, agencyCode = AGENCY_CODE) {
  const cleanAccount = String(accountNumber).replace(/\D/g, "").padStart(13, "0").slice(-13);
  const cleanAgency = String(agencyCode).replace(/\D/g, "").padStart(3, "0").slice(-3);
  const cleanBank = String(bankCode).replace(/\D/g, "").padStart(2, "0").slice(-2);
  const ribWithoutControl = `${cleanBank}${cleanAgency}${cleanAccount}`; // 18 chiffres
  const controlKey = computeControlKey(ribWithoutControl);
  return `${ribWithoutControl}${controlKey}`; // 20 chiffres
}

/**
 * Génère l'IBAN tunisien complet à partir d'un RIB complet.
 * Le RIB doit être une chaîne de 20 chiffres composée de :
 *   - Code Banque (2 chiffres)
 *   - Code Agence (3 chiffres)
 *   - Numéro de compte (13 chiffres)
 *   - Clé de contrôle (2 chiffres)
 * L'IBAN aura le format : [COUNTRY_CODE][IBAN Checksum][RIB]
 */
function generateRIB(rib) {
  const ribClean = rib.replace(/\s+/g, "");
  if (!/^\d{20}$/.test(ribClean)) {
    throw new Error("Le RIB doit contenir exactement 20 chiffres.");
  }
  // Pour calculer le checksum de l'IBAN, on déplace le RIB puis le code pays (converti en chiffres) et "00"
  const numericCountry = convertToNumeric(COUNTRY_CODE);
  const checkString = ribClean + numericCountry + "00";
  const remainder = mod97(checkString);
  const ibanChecksum = (98 - remainder).toString().padStart(2, "0");
  return `${COUNTRY_CODE}${ibanChecksum}${ribClean}`;
}

/**
 * (Optionnel) Génère un OTP à 6 chiffres.
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
  COUNTRY_CODE,
  BANK_CODE,
  AGENCY_CODE,
  DOMICILIATION,
  generateAccountNumber,
  buildCompleteRIB,
  generateRIB,
  generateIBAN: generateRIB, // Alias explicite
  generateOTP,
  computeControlKey,
};
