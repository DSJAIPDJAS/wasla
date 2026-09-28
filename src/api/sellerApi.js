import { request } from "./http";

const JSON_HEADERS = { "Content-Type": "application/json" };
const send = (method, body) => ({ method, headers: JSON_HEADERS, body: JSON.stringify(body) });

// Only this seller's own listings.
export const fetchSellerProducts = (sellerId, signal) =>
  request(`/products?sellerId=${encodeURIComponent(sellerId)}`, { signal });

export const createSellerProduct = (data) => request("/products", send("POST", data));

// PUT replaces the whole product, so pass the complete object (existing fields + your changes).
export const updateSellerProduct = (id, data) =>
  request(`/products/${encodeURIComponent(id)}`, send("PUT", data));

// Already deleted (404) counts as success.
export async function deleteSellerProduct(id) {
  try {
    await request(`/products/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (err) {
    if (err.status !== 404) throw err;
  }
}

// json-server can't filter on a field nested inside `items[]`, so this fetches every order and
// the slice filters client-side for ones containing at least one of this seller's products —
// same "no real query route" situation as couponsApi.applyCoupon and profileApi.changePassword.
export const fetchAllOrdersForFiltering = (signal) => request("/orders?_sort=createdAt&_order=desc", { signal });

// PATCH: only `status` changes. Shared with adminApi.updateOrderStatus's endpoint — in a real,
// multi-seller marketplace each seller would own a line-item status instead of the whole order;
// this project keeps one status per order, so a seller update here affects the whole order.
export const updateOrderStatus = (id, status) =>
  request(`/orders/${encodeURIComponent(id)}`, send("PATCH", { status }));

// Turns an existing customer account into a pending seller application (Profile > "Become a
// seller"), or is used directly by Register's "Sell on wasla" toggle for new accounts.
export const applyForSeller = (userId, storeName) =>
  request(`/users/${encodeURIComponent(userId)}`, send("PATCH", { role: "seller", sellerStatus: "pending", storeName }));
