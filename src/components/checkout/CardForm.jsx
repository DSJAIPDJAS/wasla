import { useEffect, useState } from "react";
import FormField from "../common/FormField";
import { isFutureExpiry, isValidCardNumber, isValidCvc } from "../../utils/validators";

const EMPTY = { number: "", name: "", expiry: "", cvc: "" };

// Formats as the user types: "4242 4242 4242 4242".
const formatCardNumber = (raw) =>
  raw.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();

// Formats as "MM/YY", inserting the slash automatically.
const formatExpiry = (raw) => {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

function validate(v) {
  const e = {};
  if (!isValidCardNumber(v.number)) e.number = "Enter a valid card number";
  if (!v.name.trim()) e.name = "Name on card is required";
  if (!isFutureExpiry(v.expiry)) e.expiry = "Enter a valid, non-expired MM/YY";
  if (!isValidCvc(v.cvc)) e.cvc = "3 or 4 digits";
  return e;
}

// No real gateway sits behind this (see PaymentMethod) — the app never sends or stores this
// data anywhere (not to json-server, not to localStorage). It only exists locally in this
// form's state long enough to check its shape and let Checkout simulate an authorization.
export default function CardForm({ onValidityChange }) {
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const errors = validate(values);

  useEffect(() => {
    onValidityChange(Object.keys(errors).length === 0, values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const handleChange = ({ target: { name, value } }) => {
    const formatted =
      name === "number" ? formatCardNumber(value) : name === "expiry" ? formatExpiry(value) : value;
    setValues((v) => ({ ...v, [name]: formatted }));
  };
  const handleBlur = ({ target: { name } }) => setTouched((t) => ({ ...t, [name]: true }));

  const field = (name) => ({
    id: `card-${name}`,
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: touched[name] ? errors[name] : undefined,
  });

  return (
    <div className="row gx-3 mt-3 pt-3 border-top" aria-label="Card details">
      <div className="col-12">
        <FormField
          {...field("number")}
          label="Card number"
          placeholder="4242 4242 4242 4242"
          inputMode="numeric"
          autoComplete="cc-number"
        />
      </div>
      <div className="col-12">
        <FormField {...field("name")} label="Name on card" autoComplete="cc-name" />
      </div>
      <div className="col-6">
        <FormField
          {...field("expiry")}
          label="Expiry"
          placeholder="MM/YY"
          inputMode="numeric"
          autoComplete="cc-exp"
        />
      </div>
      <div className="col-6">
        <FormField
          {...field("cvc")}
          label="CVC"
          placeholder="123"
          inputMode="numeric"
          maxLength={4}
          autoComplete="cc-csc"
        />
      </div>
      <div className="col-12">
        <p className="small text-secondary mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-shield-lock" aria-hidden="true" />
          Simulated payment for this demo — no card data is sent or stored anywhere.
        </p>
      </div>
    </div>
  );
}
