import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyForSeller, resetApplyStatus } from "../../store/reducers/sellerSlice";
import { authSlice } from "../../store/reducers/authSlice";
import { setAuthUser } from "../../utils/localStorage";
import FormField from "../common/FormField";

// Turns the logged-in customer's own account into a pending seller application. Approval
// happens in Admin > Users (see AdminUsers.jsx) — until then the account stays a regular
// customer for everything except the locked Seller Center (see SellerLayout's pending screen).
export default function BecomeSeller() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { applyStatus, applyError } = useSelector((s) => s.seller);
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState("");
  const submitting = applyStatus === "loading";

  useEffect(() => {
    dispatch(resetApplyStatus());
  }, [dispatch]);

  if (user.role === "seller") {
    return (
      <div>
        <p className="mb-1">
          You already have a seller account
          {user.storeName ? <> for <strong>{user.storeName}</strong></> : ""}.
        </p>
        <p className="small text-secondary mb-0">
          {user.sellerStatus === "approved"
            ? "It's approved — open the Seller Center from your account menu to manage products and orders."
            : user.sellerStatus === "pending"
              ? "It's still waiting for admin approval."
              : "It wasn't approved. Contact support if you think this is a mistake."}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!storeName.trim()) {
      setError("Store name is required");
      return;
    }
    setError("");
    try {
      const updated = await dispatch(applyForSeller({ userId: user.id, storeName: storeName.trim() })).unwrap();
      dispatch(authSlice.actions.setUser(updated));
      setAuthUser(updated);
    } catch {
      /* the error message is already in the store */
    }
  };

  if (applyStatus === "succeeded") {
    return (
      <div className="alert alert-success mb-0" role="status">
        Application sent! We'll review <strong>{storeName}</strong> and you'll see it approved from
        the Seller Center in your account menu once it's ready.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ maxWidth: 420 }}>
      <p className="text-secondary">
        List and manage your own products on wasla. An admin reviews every new store before it goes live.
      </p>
      <FormField
        id="storeName"
        label="Store name"
        placeholder="Your shop's name"
        value={storeName}
        onChange={(e) => {
          setStoreName(e.target.value);
          setError("");
        }}
        error={error}
      />
      {applyError && (
        <div className="alert alert-danger py-2" role="alert">
          {applyError}
        </div>
      )}
      <button type="submit" className="btn btn-accent px-4" disabled={submitting}>
        {submitting ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            Submitting...
          </>
        ) : (
          "Apply to become a seller"
        )}
      </button>
    </form>
  );
}
