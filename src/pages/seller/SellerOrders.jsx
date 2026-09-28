import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSellerOrders,
  fetchSellerProducts,
  resetOrdersStatus,
  updateSellerOrderStatus,
} from "../../store/reducers/sellerSlice";
import OrderStatus from "../../components/orders/OrderStatus";
import { formatPrice } from "../../utils/format";
import { ORDER_STATUSES, formatOrderDate, orderNumber } from "../../utils/checkout";

const FILTERS = ["all", ...ORDER_STATUSES];
const label = (s) => s[0].toUpperCase() + s.slice(1);

const sellerItemsTotal = (order, sellerId) =>
  (order.items ?? [])
    .filter((i) => i.sellerId === sellerId)
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

export default function SellerOrders() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { products, productsStatus, orders, ordersStatus, ordersError, updatingOrderIds } = useSelector(
    (s) => s.seller
  );
  const [params, setParams] = useSearchParams();

  const status = FILTERS.includes(params.get("status")) ? params.get("status") : "all";
  const productIds = useMemo(() => products.map((p) => p.id), [products]);

  useEffect(() => {
    dispatch(fetchSellerProducts(user.id));
  }, [dispatch, user.id]);

  useEffect(() => {
    if (productsStatus !== "succeeded") return;
    const request = dispatch(fetchSellerOrders(productIds));
    return () => {
      request.abort();
      dispatch(resetOrdersStatus());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, productsStatus, products.length]);

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

  const counts = useMemo(() => {
    const c = { all: orders.length };
    ORDER_STATUSES.forEach((s) => (c[s] = orders.filter((o) => o.status === s).length));
    return c;
  }, [orders]);

  const visible = useMemo(
    () => orders.filter((o) => status === "all" || o.status === status),
    [orders, status]
  );

  const hasOrders = orders.length > 0;
  const loading = !hasOrders && (ordersStatus === "idle" || ordersStatus === "loading" || productsStatus === "loading");
  const failed = !hasOrders && ordersStatus === "failed";

  return (
    <>
      <div className="mb-4">
        <p className="eyebrow mb-1">Your orders</p>
        <h1 className="h3 mb-1">طلبات متجري</h1>
        {hasOrders && (
          <p className="small text-secondary mb-0">
            Showing {visible.length} of {orders.length} orders that include your products
          </p>
        )}
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filter by status">
        {FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip${status === s ? " active" : ""}`}
            aria-pressed={status === s}
            onClick={() => setParam("status", s)}
          >
            {label(s)} <span className="opacity-75 ms-1">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {failed ? (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{ordersError || "We couldn't load your orders."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchSellerOrders(productIds))}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="admin-card p-4 placeholder-glow" aria-busy="true" aria-label="Loading orders">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="placeholder d-block col-12 mb-3" style={{ height: 24 }} />
          ))}
        </div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="table admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Your items</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end">Your share</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => {
                  const updating = updatingOrderIds.includes(order.id);
                  const myItems = (order.items ?? []).filter((i) => i.sellerId === user.id);
                  return (
                    <tr key={order.id}>
                      <td className="fw-semibold">#{orderNumber(order.id)}</td>
                      <td>
                        <div>{order.customer?.name ?? "-"}</div>
                        <div className="small text-secondary">{order.customer?.email}</div>
                      </td>
                      <td className="small">
                        {myItems.map((i) => `${i.title} ×${i.quantity}`).join(", ")}
                      </td>
                      <td className="text-nowrap">{formatOrderDate(order.createdAt)}</td>
                      <td><OrderStatus status={order.status} /></td>
                      <td className="text-end fw-semibold">{formatPrice(sellerItemsTotal(order, user.id))}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          style={{ minWidth: 140 }}
                          aria-label={`Update status of order ${orderNumber(order.id)}`}
                          value={order.status}
                          disabled={updating}
                          onChange={(e) => dispatch(updateSellerOrderStatus({ id: order.id, status: e.target.value }))}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{label(s)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary py-5">
                      {hasOrders ? "No orders match this filter." : "No orders include your products yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="small text-secondary mt-3 mb-0">
        Status applies to the whole order, not just your items — if a customer's order mixes products from several
        sellers, coordinate with them before changing it.
      </p>
    </>
  );
}
