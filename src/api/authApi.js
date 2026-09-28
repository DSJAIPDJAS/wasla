import { request } from "./http";

// Never keep the password in app state or localStorage.
const withoutPassword = ({ password: _password, ...user }) => user;

export async function login(email, password) {
  const query = new URLSearchParams({ email: email.trim().toLowerCase(), password });
  const [found] = await request(`/users?${query}`);
  if (!found) throw new Error("Invalid email or password");
  if (found.status && found.status !== "active") {
    throw new Error("This account is not active. Contact support.");
  }
  return withoutPassword(found);
}

// `wantsSeller` + `storeName` are optional: checked on the Register page's "Sell on wasla" toggle.
// A seller account is created active (they can log in right away) but `sellerStatus: "pending"`
// until an admin approves it from Admin > Users — the Seller Center stays locked until then.
export async function register({ name, email, phone = "", password, wantsSeller = false, storeName = "" }) {
  const normalized = email.trim().toLowerCase();
  const existing = await request(`/users?email=${encodeURIComponent(normalized)}`);
  if (existing.length) throw new Error("This email is already registered");

  const created = await request("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.trim(),
      email: normalized,
      phone: phone.trim(),
      password,
      role: wantsSeller ? "seller" : "customer", // public sign-up is customer, or seller pending approval
      status: "active",
      ...(wantsSeller ? { sellerStatus: "pending", storeName: storeName.trim() } : {}),
      createdAt: new Date().toISOString(),
    }),
  });
  return withoutPassword(created);
}

// Client-only Google Sign-In: decodes the ID token's payload (base64, NOT signature-verified —
// there's no backend here to verify it against Google's certs) to get name/email, then finds or
// creates a matching user. This is fine for a demo; a production app must verify the token
// server-side before trusting it. Needs VITE_GOOGLE_CLIENT_ID configured (see .env.example).
export async function loginWithGoogleIdToken(idToken) {
  const payload = JSON.parse(atob(idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  const email = (payload.email || "").trim().toLowerCase();
  if (!email) throw new Error("Google didn't return an email address for this account.");

  const [existing] = await request(`/users?email=${encodeURIComponent(email)}`);
  if (existing) {
    if (existing.status && existing.status !== "active") {
      throw new Error("This account is not active. Contact support.");
    }
    return withoutPassword(existing);
  }

  const created = await request("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name || email.split("@")[0],
      email,
      phone: "",
      password: null, // Google-only account, never used to log in with a password
      provider: "google",
      role: "customer",
      status: "active",
      createdAt: new Date().toISOString(),
    }),
  });
  return withoutPassword(created);
}
