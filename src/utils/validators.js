// Shared with ShippingForm's own copy of this pattern (Egyptian mobile: 010 / 011 / 012 / 015).
export const PHONE_RE = /^(\+?20|0)?1[0125]\d{8}$/;
export const isValidPhone = (phone) => PHONE_RE.test(phone.replace(/[\s-]/g, ""));

// Luhn check — catches typos, not fraud. There's no real card network behind this project
// (see PaymentMethod / CardForm), so this only validates the *shape* of a card number.
export function isValidCardNumber(number) {
  const digits = number.replace(/\s+/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

// Expects "MM/YY". Valid through the end of the given month.
export function isFutureExpiry(mmYY) {
  const match = /^(\d{2})\/(\d{2})$/.exec(mmYY.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const expiry = new Date(year, month, 1); // first day of the month *after* expiry
  return expiry > new Date();
}

export const isValidCvc = (cvc) => /^\d{3,4}$/.test(cvc.trim());
