import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCategory,
  fetchAdminCategories,
  fetchAdminProducts,
  resetCategoriesStatus,
} from "../../store/reducers/adminSlice";

export default function AdminCategories() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { categories, categoriesStatus, categoriesError, deletingCategoryIds, products } = useSelector(
    (s) => s.admin
  );
  const [confirmingId, setConfirmingId] = useState(null);
  const notice = location.state?.notice;

  useEffect(() => {
    const a = dispatch(fetchAdminCategories());
    const b = dispatch(fetchAdminProducts()); // for the "products in this category" count
    return () => {
      a.abort();
      b.abort();
      dispatch(resetCategoriesStatus());
    };
  }, [dispatch]);

  const countFor = (slug) => products.filter((p) => p.category === slug).length;

  const hasCategories = categories.length > 0;
  const loading = !hasCategories && (categoriesStatus === "idle" || categoriesStatus === "loading");
  const failed = !hasCategories && categoriesStatus === "failed";

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">Categories management</p>
          <h1 className="h3 mb-1">إدارة الفئات</h1>
          {hasCategories && <p className="small text-secondary mb-0">{categories.length} categories</p>}
        </div>
        <Link to="/admin/categories/new" className="btn btn-accent">
          <i className="bi bi-plus-lg me-1" aria-hidden="true" />
          Add category
        </Link>
      </div>

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
          <span>{categoriesError || "We couldn't load the categories."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchAdminCategories())}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="admin-card p-4 placeholder-glow" aria-busy="true" aria-label="Loading categories">
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
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const deleting = deletingCategoryIds.includes(c.id);
                  const count = countFor(c.slug);
                  return (
                    <tr key={c.id}>
                      <td className="fw-semibold text-capitalize">{c.name}</td>
                      <td className="text-secondary">{c.slug}</td>
                      <td>{count}</td>
                      <td className="text-nowrap">
                        {confirmingId === c.id ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <span className="small">Delete?</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              disabled={deleting}
                              onClick={() => {
                                dispatch(deleteCategory(c.id));
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
                            <Link to={`/admin/categories/${c.id}/edit`} className="btn btn-sm btn-outline-secondary" aria-label={`Edit ${c.name}`}>
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={deleting || count > 0}
                              title={count > 0 ? "Move or delete its products first" : undefined}
                              aria-label={`Delete ${c.name}`}
                              onClick={() => setConfirmingId(c.id)}
                            >
                              {deleting ? "Deleting..." : "Delete"}
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-secondary py-5">
                      No categories yet.
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
