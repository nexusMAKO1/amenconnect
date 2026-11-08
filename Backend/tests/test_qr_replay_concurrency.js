// scratch/test_qr_replay_concurrency.js
const http = require("http");

console.log("=================================================");
console.log("TEST SUITE: QR Session Replay & Concurrency Tests");
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

  const testSessionId = "session-test-sec-" + Date.now();

  // Step 1: Create session
  const createRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/qr-login/create",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, { sessionId: testSessionId });

  assert(createRes.status === 200, "POST /api/qr-login/create returns HTTP 200");
  assert(createRes.body.sessionId === testSessionId, "Returned sessionId matches requested ID");

  // Step 2: Poll pending session
  const pollPending = await request({
    hostname: "localhost",
    port: 3000,
    path: `/api/qr-login/${testSessionId}`,
    method: "GET",
  });
  assert(pollPending.status === 200, "Polling pending session returns HTTP 200");
  assert(pollPending.body.status === "pending", "Session status is 'pending'");
  assert(!pollPending.body.token, "No token issued while session is pending");

  // Step 3: Authenticate session via internal DB update or valid user
  // Let's authenticate directly in MongoDB via docker exec
  const { execSync } = require("child_process");
  const authCmd = `docker exec amenconnect-backend node -e '
    const mongoose = require("mongoose");
    const QRSession = require("./models/QRSession");
    const User = require("./models/User");
    mongoose.connect(process.env.MONGO_URI || "mongodb://mongodb:27017/amenconnect").then(async () => {
      let user = await User.findOne();
      if (!user) {
        user = await User.create({
          cin: "08888888", nom: "Test", prenom: "QR", email: "qr.test@amenbank.com.tn",
          telephone: "20000000", employeur: "Bank", adresseEmployeur: "Tunis", password: "Pass"
        });
      }
      await QRSession.findOneAndUpdate(
        { sessionId: "${testSessionId}" },
        { status: "authenticated", user: user._id }
      );
      process.exit(0);
    });
  '`;
  execSync(authCmd);
  console.log("✓ Session marked 'authenticated' in database");

  // Step 4: First redemption (Normal Kiosk redemption)
  const redeem1 = await request({
    hostname: "localhost",
    port: 3000,
    path: `/api/qr-login/${testSessionId}`,
    method: "GET",
  });
  assert(redeem1.status === 200, "First redemption returns HTTP 200");
  assert(redeem1.body.status === "authenticated", "First redemption receives status 'authenticated'");
  assert(typeof redeem1.body.token === "string" && redeem1.body.token.length > 20, "First redemption receives valid JWT token");
  assert(redeem1.headers["set-cookie"] !== undefined, "First redemption sets HttpOnly session cookie");

  // Step 5: Replay attack (Second redemption of same session)
  const redeem2 = await request({
    hostname: "localhost",
    port: 3000,
    path: `/api/qr-login/${testSessionId}`,
    method: "GET",
  });
  assert(redeem2.status === 409, "Second redemption (replay attempt) is REJECTED with HTTP 409 Conflict");
  assert(redeem2.body.status === "consumed", "Second redemption receives status 'consumed'");
  assert(!redeem2.body.token, "Second redemption receives NO token (replay prevented)");

  // Step 6: Concurrency test: 5 simultaneous requests attempting to redeem the same authenticated session
  const concurrentSessionId = "session-concurrent-" + Date.now();
  await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/qr-login/create",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, { sessionId: concurrentSessionId });

  execSync(`docker exec amenconnect-backend node -e '
    const mongoose = require("mongoose");
    const QRSession = require("./models/QRSession");
    const User = require("./models/User");
    mongoose.connect(process.env.MONGO_URI || "mongodb://mongodb:27017/amenconnect").then(async () => {
      const user = await User.findOne();
      await QRSession.findOneAndUpdate(
        { sessionId: "${concurrentSessionId}" },
        { status: "authenticated", user: user._id }
      );
      process.exit(0);
    });
  '`);

  console.log("Testing 5 simultaneous concurrent redemption requests...");
  const concurrentRequests = Array.from({ length: 5 }, () =>
    request({
      hostname: "localhost",
      port: 3000,
      path: `/api/qr-login/${concurrentSessionId}`,
      method: "GET",
    })
  );

  const results = await Promise.all(concurrentRequests);
  const successCount = results.filter((r) => r.status === 200 && r.body.status === "authenticated" && r.body.token).length;
  const conflictCount = results.filter((r) => r.status === 409 && r.body.status === "consumed" && !r.body.token).length;

  assert(successCount === 1, `Exactly ONE concurrent request succeeded in token redemption (got ${successCount})`);
  assert(conflictCount === 4, `Exactly 4 concurrent requests were atomically rejected with 409 (got ${conflictCount})`);

  // Step 7: Non-existent or expired session
  const expiredRes = await request({
    hostname: "localhost",
    port: 3000,
    path: `/api/qr-login/non-existent-session-id`,
    method: "GET",
  });
  assert(expiredRes.status === 404, "Non-existent / expired session returns HTTP 404");

  console.log("-------------------------------------------------");
  console.log(`Results: ${passed} of ${total} QR security tests passed.`);
  console.log("=================================================");
}

run().catch((err) => {
  console.error("Test runner encountered unexpected error:", err);
  process.exit(1);
});
