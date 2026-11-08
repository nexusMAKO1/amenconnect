// Backend/tests/test_otp_customer_and_banker_separate.js
const http = require("http");

function request(options, postData) {
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
  console.log("=================================================");
  console.log("TEST SUITE: Customer & Banker 2FA OTP via Mailpit");
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

  // ==========================================
  // PART A: CUSTOMER (CLIENT) OTP VERIFICATION
  // ==========================================
  console.log("\n--- Part A: Customer OTP Delivery & Verification ---");
  const customerEmail = `customer.otp.${Date.now()}@amenbank.com.tn`;
  const customerCin = String(Math.floor(10000000 + Math.random() * 90000000));
  const customerPassword = "CustomerSecurePass123!";

  // 1. Register Customer
  const custReg = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/register",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    cin: customerCin,
    nom: "Ben Mahmoud",
    prenom: "Kais",
    email: customerEmail,
    telephone: "21334455",
    employeur: "Tech Tunisia",
    adresseEmployeur: "Lac 1, Tunis",
    password: customerPassword
  });
  assert(custReg.status === 201, `Customer registration succeeded (HTTP ${custReg.status})`);

  // 2. Customer Login (Triggers OTP Email)
  const custLogin = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/login",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    email: customerEmail,
    password: customerPassword
  });
  assert(custLogin.status === 200, "Customer login triggers 2FA OTP with HTTP 200");

  // 3. Retrieve Customer OTP from Mailpit
  await new Promise((r) => setTimeout(r, 600));
  const mailpitMsgsCust = await request({
    hostname: "localhost",
    port: 8025,
    path: "/api/v1/messages",
    method: "GET",
  });
  const custMsg = mailpitMsgsCust.body.messages.find((m) => m.To[0].Address === customerEmail);
  assert(custMsg !== undefined, `OTP email delivered to Mailpit for Customer (${customerEmail})`);

  const custMsgDetail = await request({
    hostname: "localhost",
    port: 8025,
    path: `/api/v1/message/${custMsg.ID}`,
    method: "GET",
  });
  const custOtpMatch = custMsgDetail.body.HTML.match(/<div class="otp">\s*([0-9]{6})\s*<\/div>/);
  const customerOtp = custOtpMatch ? custOtpMatch[1] : null;
  assert(customerOtp !== null && customerOtp.length === 6, `Customer 6-digit OTP code extracted (${customerOtp})`);

  // 4. Test Invalid OTP Rejection
  const custInvalid = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/verify-otp",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    email: customerEmail,
    otp: "000000"
  });
  assert(custInvalid.status === 400, "Customer invalid OTP rejected with HTTP 400");

  // 5. Test Valid OTP Verification
  const custVerify = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/verify-otp",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    email: customerEmail,
    otp: customerOtp
  });
  assert(custVerify.status === 200, "Customer valid OTP verified successfully with HTTP 200");
  assert(custVerify.headers["set-cookie"] !== undefined, "Customer receives HTTP session cookie ('token')");

  // ==========================================
  // PART B: BANKER (ADMIN) OTP VERIFICATION
  // ==========================================
  console.log("\n--- Part B: Banker / Admin OTP Delivery & Verification ---");
  const bankerEmail = `banker.otp.${Date.now()}@amenbank.com.tn`;
  const bankerCin = String(Math.floor(10000000 + Math.random() * 90000000));
  const bankerPassword = "BankerSecurePass123!";

  // 1. Register Banker / Admin
  const bankReg = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/admin/register",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    name: "Dr. Karim Mansour",
    cin: bankerCin,
    email: bankerEmail,
    password: bankerPassword,
    role: "admin",
    department: "Audit & Risque"
  });
  assert(bankReg.status === 201, `Banker registration succeeded (HTTP ${bankReg.status})`);

  // 2. Banker Login (Triggers OTP Email)
  const bankLogin = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/admin/login",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    email: bankerEmail,
    password: bankerPassword
  });
  assert(bankLogin.status === 200, "Banker login triggers 2FA OTP with HTTP 200");

  // 3. Retrieve Banker OTP from Mailpit
  await new Promise((r) => setTimeout(r, 600));
  const mailpitMsgsBank = await request({
    hostname: "localhost",
    port: 8025,
    path: "/api/v1/messages",
    method: "GET",
  });
  const bankMsg = mailpitMsgsBank.body.messages.find((m) => m.To[0].Address === bankerEmail && m.Subject.includes("OTP"));
  assert(bankMsg !== undefined, `OTP email delivered to Mailpit for Banker (${bankerEmail})`);

  const bankMsgDetail = await request({
    hostname: "localhost",
    port: 8025,
    path: `/api/v1/message/${bankMsg.ID}`,
    method: "GET",
  });
  const bankOtpMatch = bankMsgDetail.body.HTML.match(/<div class="otp">\s*([0-9]{6})\s*<\/div>/);
  const bankerOtp = bankOtpMatch ? bankOtpMatch[1] : null;
  assert(bankerOtp !== null && bankerOtp.length === 6, `Banker 6-digit OTP code extracted (${bankerOtp})`);

  // 4. Test Invalid Banker OTP Rejection
  const bankInvalid = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/admin/verify-otp",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    email: bankerEmail,
    otp: "111111"
  });
  assert(bankInvalid.status === 400, "Banker invalid OTP rejected with HTTP 400");

  // 5. Test Valid Banker OTP Verification
  const bankVerify = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/admin/verify-otp",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    email: bankerEmail,
    otp: bankerOtp
  });
  assert(bankVerify.status === 200, "Banker valid OTP verified successfully with HTTP 200");
  assert(bankVerify.headers["set-cookie"] !== undefined, "Banker receives HTTP session cookie ('adminToken')");

  // 6. Test Admin Profile Fetch with Cookie
  const adminCookie = bankVerify.headers["set-cookie"][0].split(";")[0];
  const adminProfile = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/admin/profile",
    method: "GET",
    headers: { Cookie: adminCookie }
  });
  assert(adminProfile.status === 200, "Banker session cookie permits authenticated profile access");
  assert(adminProfile.body.admin && adminProfile.body.admin.email === bankerEmail, "Authenticated profile matches banker identity");

  console.log("\n-------------------------------------------------");
  console.log(`Results: ${passed} of ${total} Customer & Banker OTP tests passed.`);
  console.log("=================================================");
}

run().catch((err) => {
  console.error("Test runner encountered unexpected error:", err);
  process.exit(1);
});
