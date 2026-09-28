import CardForm from "./CardForm";
import WalletForm from "./WalletForm";

const METHODS = [
  { id: "cod", label: "Cash on delivery", hint: "Pay in cash when your order arrives.", icon: "bi-cash-coin" },
  { id: "card", label: "Credit card", hint: "Pay online with your card (simulated).", icon: "bi-credit-card" },
  { id: "wallet", label: "Wallet", hint: "Pay with a mobile wallet (simulated).", icon: "bi-wallet2" },
];

// `onPaymentDetailsChange(isValid, details)` only matters for card/wallet — COD has nothing to
// validate, so Checkout treats it as always-valid. Card/wallet processing is simulated: see
// CardForm/WalletForm and Checkout's handlePlaceOrder for what that means in practice.
export default function PaymentMethod({ value, onChange, onPaymentDetailsChange }) {
  return (
    <fieldset>
      <legend className="visually-hidden">Payment method</legend>
      <div className="d-grid gap-2">
        {METHODS.map(({ id, label, hint, icon }) => (
          <label
            key={id}
            className={`payment-option d-flex align-items-center gap-3 p-3 rounded-3${
              value === id ? " selected" : ""
            }`}
          >
            <input
              type="radio"
              name="payment"
              className="form-check-input mt-0"
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
            />
            <i className={`bi ${icon} fs-4 text-wasla`} aria-hidden="true" />
            <span className="flex-grow-1">
              <span className="d-block fw-semibold">{label}</span>
              <span className="d-block small text-secondary">{hint}</span>
            </span>
          </label>
        ))}
      </div>

      {value === "card" && <CardForm onValidityChange={onPaymentDetailsChange} />}
      {value === "wallet" && <WalletForm onValidityChange={onPaymentDetailsChange} />}
    </fieldset>
  );
}
