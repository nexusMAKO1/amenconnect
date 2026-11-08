// scratch/test_rib_and_customer_registration.js
const {
  BANK_CODE,
  AGENCY_CODE,
  DOMICILIATION,
  generateAccountNumber,
  buildCompleteRIB,
  generateRIB,
  generateIBAN,
  computeControlKey,
} = require("../config/helper");

console.log("=================================================");
console.log("TEST SUITE: Tunisian Banking RIB & IBAN Standards");
console.log("=================================================");

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// 1. Account Number length & format
const accNum = generateAccountNumber();
assert(/^\d{13}$/.test(accNum), `Account number is exactly 13 digits (${accNum})`);

// 2. Control Key calculation
const testRib18 = `${BANK_CODE}${AGENCY_CODE}${accNum}`;
assert(testRib18.length === 18, `RIB without key is exactly 18 digits (${testRib18})`);

const key = computeControlKey(testRib18);
assert(/^\d{2}$/.test(key), `Control key is exactly 2 digits (${key})`);

// 3. Complete 20-digit RIB
const completeRib = buildCompleteRIB(accNum);
assert(/^\d{20}$/.test(completeRib), `Complete RIB is exactly 20 digits (${completeRib})`);
assert(completeRib.startsWith(BANK_CODE + AGENCY_CODE), `RIB starts with Amen Bank code ${BANK_CODE} and agency ${AGENCY_CODE}`);

// 4. Tunisian IBAN format
const iban = (generateIBAN || generateRIB)(completeRib);
assert(/^TN\d{22}$/.test(iban), `Tunisian IBAN is exactly 24 characters starting with TN (${iban})`);
assert(iban.endsWith(completeRib), `IBAN contains the 20-digit RIB as suffix`);

console.log("-------------------------------------------------");
console.log(`RIB/IBAN Helper Tests: ${passed} of ${total} passed.`);
console.log("=================================================");
