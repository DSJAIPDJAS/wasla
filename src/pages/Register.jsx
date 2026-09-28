import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register, resetStatus } from "../store/reducers/authSlice";
import FormField from "../components/common/FormField";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import { isValidPhone } from "../utils/validators";

const validate = ({ name, email, phone, password, confirmPassword, wantsSeller, storeName }) => {
  const errors = {};
  if (!name.trim()) errors.name = "Name is required";
  if (!email.trim()) errors.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email address";
  if (!phone.trim()) errors.phone = "Phone is required";
  else if (!isValidPhone(phone)) errors.phone = "Enter a valid Egyptian mobile number, e.g. 01012345678";
  if (!password) errors.password = "Password is required";
  else if (password.length < 6) errors.password = "Use at least 6 characters";
  if (!confirmPassword) errors.confirmPassword = "Confirm your password";
  else if (confirmPassword !== password) errors.confirmPassword = "Passwords don't match";
  if (wantsSeller && !storeName.trim()) errors.storeName = "Store name is required to sell on wasla";
  return errors;
};

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, status, error } = useSelector((s) => s.auth);
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    wantsSeller: params.get("seller") === "1", storeName: "",
  });
  const [errors, setErrors] = useState({});

  const loading = status === "loading";

  useEffect(() => {
    dispatch(resetStatus());
  }, [dispatch]);

  if (user) return <Navigate to="/" replace />;

  const handleChange = ({ target: { name, value, type, checked } }) => {
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const { name, email, phone, password, wantsSeller, storeName } = form;
    dispatch(register({ name, email, phone, password, wantsSeller, storeName }))
      .unwrap()
      .then(() =>
        navigate("/login", {
          replace: true,
          state: { registered: true, appliedAsSeller: wantsSeller },
        })
      )
      .catch(() => {}); // the error message is already in the store
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-5">
          <div className="bg-white border rounded-4 shadow-sm p-4 p-md-5">
            <h1 className="h3 text-wasla mb-1">Create your account</h1>
            <p className="text-secondary mb-4">Save your favorites and check out faster.</p>

            {error && (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <FormField
                id="name"
                label="Full name"
                placeholder="Your name"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
              />
              <FormField
                id="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
              />
              <FormField
                id="phone"
                type="tel"
                label="Phone"
                placeholder="01012345678"
                autoComplete="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={handleChange}
                error={errors.phone}
              />
              <FormField
                id="password"
                type="password"
                label="Password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
              />
              <FormField
                id="confirmPassword"
                type="password"
                label="Confirm password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />

              <div className="form-check mb-2">
                <input
                  id="wantsSeller"
                  name="wantsSeller"
                  type="checkbox"
                  className="form-check-input"
                  checked={form.wantsSeller}
                  onChange={handleChange}
                />
                <label htmlFor="wantsSeller" className="form-check-label small fw-semibold">
                  I want to sell on wasla
                </label>
              </div>
              {form.wantsSeller && (
                <>
                  <FormField
                    id="storeName"
                    label="Store name"
                    placeholder="Your shop's name"
                    value={form.storeName}
                    onChange={handleChange}
                    error={errors.storeName}
                  />
                  <p className="small text-secondary" style={{ marginTop: "-0.5rem" }}>
                    An admin reviews every new store before it can list products — you'll still be able to
                    log in and shop right away.
                  </p>
                </>
              )}

              <button type="submit" className="btn btn-accent w-100 py-2 mt-2" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <div className="d-flex align-items-center gap-3 my-4">
              <hr className="flex-grow-1 m-0" />
              <span className="small text-secondary">or</span>
              <hr className="flex-grow-1 m-0" />
            </div>
            <GoogleSignInButton />

            <p className="text-center text-secondary small mt-4 mb-0">
              Already have an account? <Link to="/login" className="fw-semibold">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
