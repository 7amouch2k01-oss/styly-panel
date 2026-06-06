// Test script for security upgrades
const BASE = "http://localhost:3000";

async function runSecurityTests() {
  console.log("=== Testing Security Upgrades ===\n");

  // 1. Test Sync Router Access (Without Secret)
  console.log("1. Testing sync.user without x-sync-token header...");
  try {
    const res = await fetch(`${BASE}/api/trpc/sync.user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          id: 999,
          name: "Hacker User",
          email: "hacker@evil.com",
          role: "admin",
        },
      }),
    });
    const data = await res.json();
    console.log("   Status:", res.status);
    console.log("   Response:", JSON.stringify(data).substring(0, 200));
    console.log("");
  } catch (e) {
    console.log("   ERROR:", e.message, "\n");
  }

  // 2. Test Sync Router Access (With Secret)
  console.log("2. Testing sync.user with valid x-sync-token header...");
  try {
    const res = await fetch(`${BASE}/api/trpc/sync.user`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-sync-token": "default-local-sync-secret-key-12345"
      },
      body: JSON.stringify({
        json: {
          id: 999,
          name: "Sync User",
          email: "syncuser@styly.com",
          role: "user",
        },
      }),
    });
    const data = await res.json();
    console.log("   Status:", res.status);
    console.log("   Response:", JSON.stringify(data).substring(0, 200));
    console.log("");
  } catch (e) {
    console.log("   ERROR:", e.message, "\n");
  }

  // 3. Test Storage Proxy Access Control (Without Authenticated Cookie)
  console.log("3. Testing /manus-storage/test-key without cookie...");
  try {
    const res = await fetch(`${BASE}/manus-storage/test-key`, {
      redirect: "manual"
    });
    console.log("   Status:", res.status);
    const body = await res.text();
    console.log("   Body:", body);
    console.log("");
  } catch (e) {
    console.log("   ERROR:", e.message, "\n");
  }

  // 4. Test Rate Limiter (Brute-forcing signIn)
  console.log("4. Testing rate limiting on auth.signIn...");
  let rateLimited = false;
  for (let i = 1; i <= 7; i++) {
    process.stdout.write(`   Attempt ${i}... `);
    try {
      const res = await fetch(`${BASE}/api/trpc/auth.signIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            email: "invalid@styly.com",
            password: "wrong",
          },
        }),
      });
      console.log(`Status: ${res.status}`);
      if (res.status === 429) {
        rateLimited = true;
        const data = await res.json();
        console.log("   -> Rate Limited Successfully:", data.error);
        break;
      }
    } catch (e) {
      console.log("ERROR:", e.message);
    }
  }
  if (!rateLimited) {
    console.log("   -> FAILED: Was not rate limited after 7 quick requests.");
  }
  console.log("");

  console.log("=== Security Upgrade Tests Complete ===");
}

runSecurityTests().catch(console.error);
