// Quick auth flow test
const BASE = "http://localhost:3000";

async function testAuth() {
  console.log("=== Testing Full-Stack Auth Flow ===\n");

  // 1. Test auth.me (should return null when not logged in)
  console.log("1. Testing auth.me (unauthenticated)...");
  try {
    const meRes = await fetch(`${BASE}/api/trpc/auth.me`, {
      headers: { "Content-Type": "application/json" },
    });
    const meData = await meRes.json();
    console.log("   Status:", meRes.status);
    console.log("   Response:", JSON.stringify(meData).substring(0, 200));
    console.log("");
  } catch (e) {
    console.log("   ERROR:", e.message, "\n");
  }

  // 2. Test sign-up
  const testEmail = `test${Date.now()}@styly.com`;
  console.log(`2. Testing auth.signUp (email: ${testEmail})...`);
  let sessionCookie = "";
  try {
    const signUpRes = await fetch(`${BASE}/api/trpc/auth.signUp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          name: "Test Admin",
          email: testEmail,
          password: "password123",
          role: "admin",
        },
      }),
    });
    const signUpData = await signUpRes.json();
    sessionCookie = signUpRes.headers.get("set-cookie") || "";
    console.log("   Status:", signUpRes.status);
    console.log("   Response:", JSON.stringify(signUpData).substring(0, 300));
    console.log("   Set-Cookie:", sessionCookie ? sessionCookie.substring(0, 100) + "..." : "NONE");
    console.log("");
  } catch (e) {
    console.log("   ERROR:", e.message, "\n");
  }

  // 3. Test auth.me with the session cookie
  if (sessionCookie) {
    console.log("3. Testing auth.me (authenticated with cookie)...");
    try {
      const cookieName = sessionCookie.split("=")[0];
      const cookieVal = sessionCookie.split(";")[0];
      const meAuthRes = await fetch(`${BASE}/api/trpc/auth.me`, {
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieVal,
        },
      });
      const meAuthData = await meAuthRes.json();
      console.log("   Status:", meAuthRes.status);
      console.log("   Response:", JSON.stringify(meAuthData).substring(0, 300));
      console.log("   User role:", meAuthData?.result?.data?.json?.role || "N/A");
      console.log("");
    } catch (e) {
      console.log("   ERROR:", e.message, "\n");
    }
  }

  // 4. Test sign-in with created account
  console.log(`4. Testing auth.signIn (email: ${testEmail})...`);
  try {
    const signInRes = await fetch(`${BASE}/api/trpc/auth.signIn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          email: testEmail,
          password: "password123",
        },
      }),
    });
    const signInData = await signInRes.json();
    const signInCookie = signInRes.headers.get("set-cookie") || "";
    console.log("   Status:", signInRes.status);
    console.log("   Response:", JSON.stringify(signInData).substring(0, 300));
    console.log("   Set-Cookie:", signInCookie ? signInCookie.substring(0, 100) + "..." : "NONE");
    console.log("");

    // 5. Test dashboard access with sign-in cookie
    if (signInCookie) {
      const cookieVal = signInCookie.split(";")[0];
      console.log("5. Testing dashboard.metrics (authenticated admin)...");
      try {
        const dashRes = await fetch(`${BASE}/api/trpc/dashboard.metrics`, {
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieVal,
          },
        });
        const dashData = await dashRes.json();
        console.log("   Status:", dashRes.status);
        console.log("   Response:", JSON.stringify(dashData).substring(0, 300));
        console.log("");
      } catch (e) {
        console.log("   ERROR:", e.message, "\n");
      }
    }
  } catch (e) {
    console.log("   ERROR:", e.message, "\n");
  }

  // 6. Test sign-in with wrong password
  console.log("6. Testing auth.signIn (wrong password)...");
  try {
    const badRes = await fetch(`${BASE}/api/trpc/auth.signIn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          email: testEmail,
          password: "wrongpassword",
        },
      }),
    });
    const badData = await badRes.json();
    console.log("   Status:", badRes.status);
    console.log("   Response:", JSON.stringify(badData).substring(0, 200));
    console.log("");
  } catch (e) {
    console.log("   ERROR:", e.message, "\n");
  }

  // 7. Test duplicate sign-up
  console.log("7. Testing auth.signUp (duplicate email)...");
  try {
    const dupRes = await fetch(`${BASE}/api/trpc/auth.signUp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          name: "Duplicate",
          email: testEmail,
          password: "password123",
          role: "admin",
        },
      }),
    });
    const dupData = await dupRes.json();
    console.log("   Status:", dupRes.status);
    console.log("   Response:", JSON.stringify(dupData).substring(0, 200));
    console.log("");
  } catch (e) {
    console.log("   ERROR:", e.message, "\n");
  }

  console.log("=== Auth Flow Test Complete ===");
}

testAuth().catch(console.error);
