import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createBanner,
  fetchAdminBanners,
  resetBannerSave,
  resetBannersStatus,
  updateBanner,
} from "../../store/reducers/adminSlice";
import FormField from "../../components/common/FormField";

const FIELD_ORDER = ["title", "subtitle", "description", "ctaLabel", "ctaLink", "theme", "order"];
const THEMES = ["blue", "green", "purple", "orange"];

const toForm = (b) => ({
  title: b?.title ?? "",
  subtitle: b?.subtitle ?? "",
  description: b?.description ?? "",
  ctaLabel: b?.ctaLabel ?? "",
  ctaLink: b?.ctaLink ?? "",
  theme: b?.theme ?? "blue",
  order: b?.order != null ? String(b.order) : "",
  active: b?.active ?? true,
});

function validate(v) {
  const e = {};
  if (!v.title.trim()) e.title = "Title is required";
  if (!v.description.trim()) e.description = "Description is required";
  if (!v.ctaLabel.trim()) e.ctaLabel = "Button text is required";
  if (!v.ctaLink.trim()) e.ctaLink = "Link is required";
  else if (!v.ctaLink.startsWith("/") && !/^https?:\/\//.test(v.ctaLink)) {
    e.ctaLink = "Use a path starting with / or a full http(s) URL";
  }
  if (v.order.trim() !== "" && (!Number.isInteger(Number(v.order)) || Number(v.order) < 0)) {
    e.order = "Order must be a whole number, 0 or more";
  }
  return e;
}

function BannerFormView({ banner }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bannerSaveStatus, bannerSaveError } = useSelector((s) => s.admin);
  const [values, setValues] = useState(() => toForm(banner));
  const [errors, setErrors] = useState({});
  const saving = bannerSaveStatus === "loading";
  const editing = Boolean(banner);

  useEffect(() => {
    dispatch(resetBannerSave()); // forget an old error from a previous visit
  }, [dispatch]);

  const handleChange = ({ target: { name, value, type, checked } }) => {
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const found = validate(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((f) => found[f]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    const data = {
      ...(banner ?? {}),
      title: values.title.trim(),
      subtitle: values.subtitle.trim(),
      description: values.description.trim(),
      ctaLabel: values.ctaLabel.trim(),
      ctaLink: values.ctaLink.trim(),
      theme: values.theme,
      order: values.order.trim() === "" ? 0 : Number(values.order),
      active: values.active,
    };

    try {
      if (editing) await dispatch(updateBanner({ id: banner.id, data })).unwrap();
      else await dispatch(createBanner(data)).unwrap();
      navigate("/admin/banners", { state: { notice: editing ? "Banner updated." : "Banner created." } });
    } catch {
      /* the error message is already in the store */
    }
  };

  const field = (name) => ({ id: name, value: values[name], onChange: handleChange, error: errors[name] });

  return (
    <>
      <div className="mb-4">
        <p className="eyebrow mb-1">{editing ? "Edit banner" : "New banner"}</p>
        <h1 className="h3 mb-0">{editing ? "تعديل بانر" : "إضافة بانر"}</h1>
      </div>

      <form className="admin-card p-3 p-md-4" onSubmit={handleSubmit} noValidate style={{ maxWidth: 640 }}>
        <fieldset disabled={saving} className="border-0 p-0 m-0">
          <div className="row">
            <div className="col-md-6">
              <FormField {...field("subtitle")} label="Eyebrow (small pill text)" placeholder="Seasonal Exclusive" maxLength={40} />
            </div>
            <div className="col-md-6">
              <FormField {...field("theme")} as="select" label="Theme">
                {THEMES.map((t) => (
                  <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
                ))}
              </FormField>
            </div>
            <div className="col-12">
              <FormField {...field("title")} label="Title" placeholder="Fragrance & Beauty Edit" maxLength={80} />
            </div>
            <div className="col-12">
              <FormField {...field("description")} as="textarea" rows={3} label="Description" maxLength={200} />
            </div>
            <div className="col-md-6">
              <FormField {...field("ctaLabel")} label="Button text" placeholder="Explore Collection" maxLength={40} />
            </div>
            <div className="col-md-6">
              <FormField {...field("ctaLink")} label="Link" placeholder="/category/fragrances" spellCheck={false} />
            </div>
            <div className="col-md-6">
              <FormField {...field("order")} type="number" min="0" step="1" inputMode="numeric" label="Display order" placeholder="1" />
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <div className="form-check mb-3">
                <input
                  id="active"
                  name="active"
                  type="checkbox"
                  className="form-check-input"
                  checked={values.active}
                  onChange={handleChange}
                />
                <label htmlFor="active" className="form-check-label small fw-semibold">
                  Show on homepage
                </label>
              </div>
            </div>
          </div>
        </fieldset>

        {bannerSaveError && (
          <div className="alert alert-danger py-2 mt-2" role="alert">
            {bannerSaveError}
          </div>
        )}

        <div className="d-flex flex-wrap gap-2 pt-2">
          <button type="submit" className="btn btn-accent px-4" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
          <Link to="/admin/banners" className="btn btn-outline-secondary px-4">Cancel</Link>
        </div>
      </form>
    </>
  );
}

export default function AdminBannerForm() {
  const { id } = useParams(); // undefined on /admin/banners/new
  const dispatch = useDispatch();
  const { banners, bannersStatus, bannersError } = useSelector((s) => s.admin);
  const editing = id !== undefined;

  useEffect(() => {
    if (!editing) return;
    const request = dispatch(fetchAdminBanners());
    return () => {
      request.abort();
      dispatch(resetBannersStatus());
    };
  }, [dispatch, editing]);

  if (!editing) return <BannerFormView key="new" />;

  const banner = banners.find((b) => String(b.id) === id);
  if (banner) return <BannerFormView key={banner.id} banner={banner} />;

  if (bannersStatus === "succeeded" || bannersStatus === "failed") {
    return (
      <div className="text-center py-5">
        <h1 className="h4">We couldn't find this banner</h1>
        <p className="text-secondary">
          {bannersStatus === "failed" ? bannersError : "It may have been deleted."}
        </p>
        <Link to="/admin/banners" className="btn btn-outline-secondary">Back to banners</Link>
      </div>
    );
  }

  return (
    <div className="text-center py-5" role="status">
      <div className="spinner-border text-primary" />
      <span className="visually-hidden">Loading banner...</span>
    </div>
  );
}
