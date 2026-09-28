import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminUsers,
  resetUsersStatus,
  updateSellerStatus,
  updateUserStatus,
} from "../../store/reducers/adminSlice";

const ROLE_FILTERS = ["all", "customer", "seller", "admin"];
const label = (s) => s[0].toUpperCase() + s.slice(1);

export default function AdminUsers() {
  const dispatch = useDispatch();
  const currentUserId = useSelector((s) => s.auth.user?.id);
  const { users, usersStatus, usersError, updatingUserIds } = useSelector((s) => s.admin);
  const [params, setParams] = useSearchParams();
  const [confirmingId, setConfirmingId] = useState(null);

  const role = ROLE_FILTERS.includes(params.get("role")) ? params.get("role") : "all";
  const search = params.get("search") ?? "";

  useEffect(() => {
    const request = dispatch(fetchAdminUsers());
    return () => {
      request.abort();
      dispatch(resetUsersStatus());
    };
  }, [dispatch]);

  const setParam = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== "all") next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (!q) return true;
      return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });
  }, [users, role, search]);

  const pendingSellers = users.filter((u) => u.role === "seller" && u.sellerStatus === "pending");

  const hasUsers = users.length > 0;
  const loading = !hasUsers && (usersStatus === "idle" || usersStatus === "loading");
  const failed = !hasUsers && usersStatus === "failed";

  return (
    <>
      <div className="mb-4">
        <p className="eyebrow mb-1">Users management</p>
        <h1 className="h3 mb-1">إدارة المستخدمين</h1>
        {hasUsers && (
          <p className="small text-secondary mb-0">
            Showing {visible.length} of {users.length} users
          </p>
        )}
      </div>

      {pendingSellers.length > 0 && (
        <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2" role="status">
          <span>
            <i className="bi bi-shop me-2" aria-hidden="true" />
            {pendingSellers.length} seller {pendingSellers.length === 1 ? "application is" : "applications are"} waiting for approval.
          </span>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setParam("role", "seller")}>
            Review
          </button>
        </div>
      )}

      <div className="row g-2 mb-3">
        <div className="col-md-6 col-lg-4">
          <div className="search-box">
            <input
              type="search"
              className="form-control"
              placeholder="Search by name or email"
              aria-label="Search users"
              value={search}
              onChange={(e) => setParam("search", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filter by role">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r}
            type="button"
            className={`chip${role === r ? " active" : ""}`}
            aria-pressed={role === r}
            onClick={() => setParam("role", r)}
          >
            {label(r)}
          </button>
        ))}
      </div>

      {failed ? (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{usersError || "We couldn't load the users."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchAdminUsers())}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="admin-card p-4 placeholder-glow" aria-busy="true" aria-label="Loading users">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="placeholder d-block col-12 mb-3" style={{ height: 32 }} />
          ))}
        </div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="table admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Seller approval</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => {
                  const updating = updatingUserIds.includes(u.id);
                  const restricted = u.status === "restricted";
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id}>
                      <td className="fw-semibold">{u.name}</td>
                      <td className="text-secondary">{u.email}</td>
                      <td className="text-capitalize">{u.role}</td>
                      <td>
                        <span className={`badge rounded-pill ${restricted ? "stock-low" : "stock-ok"}`}>
                          {restricted ? "Restricted" : "Active"}
                        </span>
                      </td>
                      <td>
                        {u.role === "seller" ? (
                          <span
                            className={`badge rounded-pill ${
                              u.sellerStatus === "approved"
                                ? "stock-ok"
                                : u.sellerStatus === "rejected"
                                  ? "stock-low"
                                  : "text-bg-light border"
                            }`}
                          >
                            {u.sellerStatus === "approved" ? "Approved" : u.sellerStatus === "rejected" ? "Rejected" : "Pending"}
                          </span>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </td>
                      <td className="text-nowrap">
                        <div className="d-inline-flex gap-2 flex-wrap">
                          {u.role === "seller" && u.sellerStatus === "pending" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-accent"
                              disabled={updating}
                              onClick={() => dispatch(updateSellerStatus({ id: u.id, sellerStatus: "approved" }))}
                            >
                              Approve seller
                            </button>
                          )}
                          {isSelf ? (
                            <span className="small text-secondary">Your account</span>
                          ) : confirmingId === u.id ? (
                            <span className="d-inline-flex align-items-center gap-2">
                              <span className="small">{restricted ? "Reactivate?" : "Restrict?"}</span>
                              <button
                                type="button"
                                className={`btn btn-sm ${restricted ? "btn-accent" : "btn-danger"}`}
                                disabled={updating}
                                onClick={() => {
                                  dispatch(updateUserStatus({ id: u.id, status: restricted ? "active" : "restricted" }));
                                  setConfirmingId(null);
                                }}
                              >
                                Yes
                              </button>
                              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmingId(null)}>
                                No
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className={`btn btn-sm ${restricted ? "btn-outline-secondary" : "btn-outline-danger"}`}
                              disabled={updating}
                              onClick={() => setConfirmingId(u.id)}
                            >
                              {updating ? "Saving..." : restricted ? "Reactivate" : "Restrict"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-secondary py-5">
                      {hasUsers ? "No users match your filters." : "No users yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="small text-secondary mt-3 mb-0">
        Restricting is a soft delete: the account and its past orders/reviews stay on record, but the person can no longer log in.
      </p>
    </>
  );
}
