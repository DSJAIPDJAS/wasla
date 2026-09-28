import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { loginWithGoogle } from "../../store/reducers/authSlice";
import { showInfo } from "../../utils/notifications";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise = null;
function loadGsiScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Couldn't load Google Sign-In."));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

// Renders Google's real "Sign in with Google" button once VITE_GOOGLE_CLIENT_ID is set (see
// .env.example) — Google's script issues an ID token, which we hand to authSlice.loginWithGoogle.
// Without a client ID configured, this renders a clearly-labelled disabled button instead of
// pretending to work: a fake "success" here would be worse than being upfront that it needs setup.
export default function GoogleSignInButton({ onSuccess }) {
  const dispatch = useDispatch();
  const divRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID || !divRef.current) return;
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !divRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            try {
              await dispatch(loginWithGoogle(credential)).unwrap();
              onSuccess?.();
            } catch (err) {
              dispatch(showInfo(typeof err === "string" ? err : "Google sign-in failed.", "Google"));
            }
          },
        });
        window.google.accounts.id.renderButton(divRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
        });
      })
      .catch(() => dispatch(showInfo("Couldn't load Google Sign-In. Check your connection.", "Google")));

    return () => {
      cancelled = true;
    };
  }, [dispatch, onSuccess]);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
        onClick={() =>
          dispatch(
            showInfo(
              "Google sign-in needs a Client ID. Set VITE_GOOGLE_CLIENT_ID in .env (see .env.example) and restart the dev server.",
              "Google sign-in not configured"
            )
          )
        }
      >
        <i className="bi bi-google" aria-hidden="true" />
        Continue with Google
      </button>
    );
  }

  return <div ref={divRef} className="d-flex justify-content-center" />;
}
