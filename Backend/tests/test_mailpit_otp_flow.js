// tests/test_mailpit_otp_flow.js
const http = require("http");

console.log("=================================================");
console.log("TEST SUITE: Mailpit Local SMTP & 2FA OTP Delivery");
console.log("=================================================");

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
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

  const testEmail = `test.otp.${Date.now()}@amenbank.com.tn`;
  const testCin = String(Math.floor(10000000 + Math.random() * 90000000));

  // 1. Register a test user
  const regRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/register",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    cin: testCin,
    nom: "Test",
    prenom: "Mailpit",
    email: testEmail,
    telephone: "22001122",
    employeur: "Amen Bank Tech",
    adresseEmployeur: "Tunis",
    password: "Password12345!"
  });

  assert(regRes.status === 201, `Customer registration succeeds with 201 Created (got ${regRes.status})`);

  // 2. Trigger Customer Login -> OTP generation
  const loginRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/login",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    email: testEmail,
    password: "Password12345!"
  });

  assert(loginRes.status === 200, `Login triggers OTP email with HTTP 200 (got ${loginRes.status})`);

  // 3. Query Mailpit API for delivered OTP message
  const mailpitRes = await request({
    hostname: "localhost",
    port: 8025,
    path: "/api/v1/messages",
    method: "GET",
  });

  assert(mailpitRes.status === 200, "Mailpit REST API accessible on port 8025");
  const matchingMsg = mailpitRes.body.messages.find(m => m.To && m.To.some(t => t.Address === testEmail));
  assert(matchingMsg !== undefined, `Email delivered to Mailpit inbox for ${testEmail}`);

  // 4. Fetch message detail and extract OTP
  const detailRes = await request({
    hostname: "localhost",
    port: 8025,
    path: `/api/v1/message/${matchingMsg.ID}`,
    method: "GET",
  });

  const otpMatch = detailRes.body.HTML.match(/<div class="otp">\s*([0-9]{6})\s*<\/div>/);
  assert(otpMatch !== null && otpMatch[1].length === 6, "6-digit OTP code successfully parsed from email HTML");
  const otpCode = otpMatch ? otpMatch[1] : null;

  // 5. Test invalid OTP rejection
  const invalidOtpRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/verify-otp",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    email: testEmail,
    otp: "000000"
  });

  assert(invalidOtpRes.status === 400, "Invalid OTP correctly rejected with HTTP 400 Bad Request");

  // 6. Test successful OTP verification
  const validOtpRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/verify-otp",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    email: testEmail,
    otp: otpCode
  });

  assert(validOtpRes.status === 200, "Valid OTP verification succeeds with HTTP 200 OK");
  assert(validOtpRes.headers["set-cookie"] !== undefined, "Session token cookie issued upon successful OTP verification");

  console.log("-------------------------------------------------");
  console.log(`Results: ${passed} of ${total} Mailpit OTP tests passed.`);
  console.log("=================================================");
}

run().catch((err) => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});

