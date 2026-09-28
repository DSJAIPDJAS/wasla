import { useEffect, useState } from "react";
import FormField from "../common/FormField";
import { isValidPhone } from "../../utils/validators";

const EMPTY = { walletNumber: "", pin: "" };

function validate(v) {
  const e = {};
  if (!isValidPhone(v.walletNumber)) e.walletNumber = "Enter a valid Egyptian mobile number";
  if (!/^\d{4,6}$/.test(v.pin.trim())) e.pin = "4-6 digit PIN";
  return e;
}

// Same simulated-only nature as CardForm — no real wallet network is connected. The PIN is
// checked only for shape, never sent or stored, and only exists in this form's own state.
export default function WalletForm({ onValidityChange }) {
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const errors = validate(values);

  useEffect(() => {
    onValidityChange(Object.keys(errors).length === 0, values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const handleChange = ({ target: { name, value } }) =>
    setValues((v) => ({ ...v, [name]: name === "pin" ? value.replace(/\D/g, "").slice(0, 6) : value }));
  const handleBlur = ({ target: { name } }) => setTouched((t) => ({ ...t, [name]: true }));

  const field = (name) => ({
    id: `wallet-${name}`,
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: touched[name] ? errors[name] : undefined,
  });

  return (
    <div className="row gx-3 mt-3 pt-3 border-top" aria-label="Wallet details">
      <div className="col-md-7">
        <FormField
          {...field("walletNumber")}
          type="tel"
          label="Wallet mobile number"
          placeholder="01012345678"
          inputMode="numeric"
        />
      </div>
      <div className="col-md-5">
        <FormField {...field("pin")} type="password" label="Wallet PIN" inputMode="numeric" maxLength={6} />
      </div>
      <div className="col-12">
        <p className="small text-secondary mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-shield-lock" aria-hidden="true" />
          Simulated payment for this demo — no wallet data is sent or stored anywhere.
        </p>
      </div>
    </div>
  );
}
