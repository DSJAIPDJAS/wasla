import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteBanner,
  fetchAdminBanners,
  resetBannersStatus,
  toggleBannerActive,
} from "../../store/reducers/adminSlice";

export default function AdminBanners() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { banners, bannersStatus, bannersError, deletingBannerIds, togglingBannerIds } = useSelector((s) => s.admin);
  const [confirmingId, setConfirmingId] = useState(null);
  const notice = location.state?.notice;

  useEffect(() => {
    const request = dispatch(fetchAdminBanners());
    return () => {
      request.abort();
      dispatch(resetBannersStatus());
    };
  }, [dispatch]);

  const hasBanners = banners.length > 0;
  const loading = !hasBanners && (bannersStatus === "idle" || bannersStatus === "loading");
  const failed = !hasBanners && bannersStatus === "failed";

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">Content management</p>
          <h1 className="h3 mb-1">إدارة بانرات الصفحة الرئيسية</h1>
          {hasBanners && <p className="small text-secondary mb-0">{banners.length} banners</p>}
        </div>
        <Link to="/admin/banners/new" className="btn btn-accent">
          <i className="bi bi-plus-lg me-1" aria-hidden="true" />
          Add banner
        </Link>
      </div>

      <p className="small text-secondary mb-3">
        These control the two collection banners on the homepage, below the flash deals. Order decides left-to-right.
      </p>

      {notice && (
        <div className="alert alert-success d-flex justify-content-between align-items-center gap-3" role="status">
          <span>{notice}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss"
            onClick={() => navigate(`${location.pathname}`, { replace: true, state: null })}
          />
        </div>
      )}

      {failed ? (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{bannersError || "We couldn't load the banners."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchAdminBanners())}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="admin-card p-4 placeholder-glow" aria-busy="true" aria-label="Loading banners">
          {Array.from({ length: 2 }, (_, i) => (
            <span key={i} className="placeholder d-block col-12 mb-3" style={{ height: 32 }} />
          ))}
        </div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="table admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Title</th>
                  <th>Link</th>
                  <th>Theme</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((b) => {
                  const deleting = deletingBannerIds.includes(b.id);
                  const toggling = togglingBannerIds.includes(b.id);
                  return (
                    <tr key={b.id}>
                      <td>{b.order ?? "—"}</td>
                      <td>
                        <div className="fw-semibold">{b.title}</div>
                        <div className="small text-secondary">{b.subtitle}</div>
                      </td>
                      <td className="text-secondary text-nowrap">{b.ctaLink}</td>
                      <td className="text-capitalize">{b.theme}</td>
                      <td>
                        <button
                          type="button"
                          className={`badge rounded-pill border-0 ${b.active ? "stock-ok" : "stock-low"}`}
                          disabled={toggling}
                          onClick={() => dispatch(toggleBannerActive(b))}
                        >
                          {toggling ? "Saving..." : b.active ? "Active" : "Hidden"}
                        </button>
                      </td>
                      <td className="text-nowrap">
                        {confirmingId === b.id ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <span className="small">Delete?</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              disabled={deleting}
                              onClick={() => {
                                dispatch(deleteBanner(b.id));
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
                          <span className="d-inline-flex gap-2">
                            <Link to={`/admin/banners/${b.id}/edit`} className="btn btn-sm btn-outline-secondary" aria-label={`Edit ${b.title}`}>
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={deleting}
                              aria-label={`Delete ${b.title}`}
                              onClick={() => setConfirmingId(b.id)}
                            >
                              {deleting ? "Deleting..." : "Delete"}
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {banners.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-secondary py-5">
                      No banners yet — the homepage section stays hidden until you add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
