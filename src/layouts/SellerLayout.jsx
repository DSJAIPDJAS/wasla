import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/reducers/authSlice";
import { clearActionError } from "../store/reducers/sellerSlice";
import "../styles/admin.css";

const NAV = [
  { to: "/seller", label: "Dashboard", icon: "bi-grid-1x2", end: true },
  { to: "/seller/products", label: "Products", icon: "bi-box-seam" },
  { to: "/seller/orders", label: "Orders", icon: "bi-receipt" },
];

function PendingScreen({ user, onLogout }) {
  return (
    <div className="container py-5 text-center" style={{ maxWidth: 480 }}>
      <i className="bi bi-hourglass-split fs-1 text-wasla" aria-hidden="true" />
      <h1 className="h4 mt-3">Your seller application is pending</h1>
      <p className="text-secondary">
        Thanks for applying, {user.name}. An admin still needs to approve{" "}
        {user.storeName ? <strong>{user.storeName}</strong> : "your store"} before you can list
        products or see orders here. This usually doesn't take long — check back soon.
      </p>
      <div className="d-flex justify-content-center gap-2">
        <Link to="/" className="btn btn-outline-secondary">Back to store</Link>
        <button type="button" className="btn btn-outline-danger" onClick={onLogout}>Log out</button>
      </div>
    </div>
  );
}

function RejectedScreen({ user, onLogout }) {
  return (
    <div className="container py-5 text-center" style={{ maxWidth: 480 }}>
      <i className="bi bi-x-circle fs-1 text-danger" aria-hidden="true" />
      <h1 className="h4 mt-3">Seller application not approved</h1>
      <p className="text-secondary">
        {user.name}, your seller application wasn't approved. If you think this is a mistake,
        contact support.
      </p>
      <div className="d-flex justify-content-center gap-2">
        <Link to="/" className="btn btn-outline-secondary">Back to store</Link>
        <button type="button" className="btn btn-outline-danger" onClick={onLogout}>Log out</button>
      </div>
    </div>
  );
}

export default function SellerLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const actionError = useSelector((s) => s.seller.actionError);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  // ProtectedRoute already guarantees role === "seller" here; this gates on *approval*.
  if (user.sellerStatus === "pending") return <PendingScreen user={user} onLogout={handleLogout} />;
  if (user.sellerStatus === "rejected") return <RejectedScreen user={user} onLogout={handleLogout} />;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/seller" className="text-decoration-none d-block mb-3 lh-1">
          <span className="font-display fs-4 fw-bold text-wasla">wasla</span>{" "}
          <span className="font-display fs-5 fw-semibold">Seller</span>
          <span className="eyebrow d-block mt-1">{user.storeName || "Seller center"}</span>
        </Link>

        <nav className="admin-nav" aria-label="Seller">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}
            >
              <i className={`bi ${icon}`} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-3 mt-lg-auto pt-3 border-top d-flex flex-wrap flex-lg-column gap-2 align-items-lg-stretch">
          <div className="small me-auto">
            <div className="fw-semibold">{user?.name}</div>
            <div className="text-secondary text-break">{user?.email}</div>
          </div>
          <Link to="/" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-shop me-1" aria-hidden="true" />
            Back to store
          </Link>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1" aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {actionError && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center gap-3" role="alert">
            <span>{actionError}</span>
            <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => dispatch(clearActionError())} />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
