import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createCategory,
  fetchAdminCategories,
  resetCategoriesStatus,
  resetCategorySave,
  updateCategory,
} from "../../store/reducers/adminSlice";
import FormField from "../../components/common/FormField";

const FIELD_ORDER = ["name", "slug"];

const slugify = (s) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const toForm = (c) => ({ name: c?.name ?? "", slug: c?.slug ?? "" });

function CategoryFormView({ category, allCategories }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categorySaveStatus, categorySaveError } = useSelector((s) => s.admin);
  const [values, setValues] = useState(() => toForm(category));
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [errors, setErrors] = useState({});
  const saving = categorySaveStatus === "loading";
  const editing = Boolean(category);

  useEffect(() => {
    dispatch(resetCategorySave()); // forget an old error from a previous visit
  }, [dispatch]);

  const validate = (v) => {
    const e = {};
    if (!v.name.trim()) e.name = "Name is required";
    const slug = v.slug.trim();
    if (!slug) e.slug = "Slug is required";
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) e.slug = "Use lowercase letters, numbers and dashes only";
    else if (allCategories.some((c) => c.slug === slug && c.id !== category?.id)) e.slug = "This slug is already used";
    return e;
  };

  const handleChange = ({ target: { name, value } }) => {
    setValues((v) => {
      const next = { ...v, [name]: value };
      // Auto-fill the slug from the name until the person edits the slug themselves.
      if (name === "name" && !slugTouched) next.slug = slugify(value);
      return next;
    });
    if (name === "slug") setSlugTouched(true);
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

    const data = { ...(category ?? {}), name: values.name.trim(), slug: values.slug.trim() };

    try {
      if (editing) await dispatch(updateCategory({ id: category.id, data })).unwrap();
      else await dispatch(createCategory(data)).unwrap();
      navigate("/admin/categories", { state: { notice: editing ? "Category updated." : "Category created." } });
    } catch {
      /* the error message is already in the store */
    }
  };

  const field = (name) => ({ id: name, value: values[name], onChange: handleChange, error: errors[name] });

  return (
    <>
      <div className="mb-4">
        <p className="eyebrow mb-1">{editing ? "Edit category" : "New category"}</p>
        <h1 className="h3 mb-0">{editing ? "تعديل فئة" : "إضافة فئة"}</h1>
      </div>

      <form className="admin-card p-3 p-md-4" onSubmit={handleSubmit} noValidate style={{ maxWidth: 520 }}>
        <fieldset disabled={saving} className="border-0 p-0 m-0">
          <FormField {...field("name")} label="Name" placeholder="e.g. Sportswear" maxLength={60} />
          <FormField {...field("slug")} label="Slug" placeholder="e.g. sportswear" maxLength={60} spellCheck={false} />
          <p className="form-text" style={{ marginTop: "-0.5rem" }}>
            Used in the URL (/category/{values.slug || "slug"}) and as the value stored on each product.
          </p>
        </fieldset>

        {categorySaveError && (
          <div className="alert alert-danger py-2 mt-3" role="alert">
            {categorySaveError}
          </div>
        )}

        <div className="d-flex flex-wrap gap-2 pt-3">
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
          <Link to="/admin/categories" className="btn btn-outline-secondary px-4">Cancel</Link>
        </div>
      </form>
    </>
  );
}

export default function AdminCategoryForm() {
  const { id } = useParams(); // undefined on /admin/categories/new
  const dispatch = useDispatch();
  const { categories, categoriesStatus, categoriesError } = useSelector((s) => s.admin);
  const editing = id !== undefined;

  useEffect(() => {
    const request = dispatch(fetchAdminCategories());
    return () => {
      request.abort();
      dispatch(resetCategoriesStatus());
    };
  }, [dispatch]);

  if (!editing) {
    // Categories may still be loading, but new-category doesn't need to wait for them except
    // for the "slug already used" check, which just degrades to "no duplicates known yet".
    return <CategoryFormView key="new" allCategories={categories} />;
  }

  const category = categories.find((c) => String(c.id) === id);
  if (category) return <CategoryFormView key={category.id} category={category} allCategories={categories} />;

  if (categoriesStatus === "succeeded" || categoriesStatus === "failed") {
    return (
      <div className="text-center py-5">
        <h1 className="h4">We couldn't find this category</h1>
        <p className="text-secondary">
          {categoriesStatus === "failed" ? categoriesError : "It may have been deleted."}
        </p>
        <Link to="/admin/categories" className="btn btn-outline-secondary">Back to categories</Link>
      </div>
    );
  }

  return (
    <div className="text-center py-5" role="status">
      <div className="spinner-border text-primary" />
      <span className="visually-hidden">Loading category...</span>
    </div>
  );
}
