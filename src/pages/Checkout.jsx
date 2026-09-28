import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "../store/reducers/cartSlice";
import { createOrder, resetCreateStatus } from "../store/reducers/ordersSlice";
import { redeemCoupon } from "../store/reducers/couponsSlice";
import ShippingForm from "../components/checkout/ShippingForm";
import PaymentMethod from "../components/checkout/PaymentMethod";
import OrderSummary from "../components/checkout/OrderSummary";
import { formatPrice } from "../utils/format";
import { getOrderTotals, orderNumber } from "../utils/checkout";
import { showError, showSuccess } from "../utils/notifications";

// One short simulated delay so card/wallet feel like they actually went through a gateway.
// COD needs no such delay — nothing is "processed" until the order arrives.
const SIMULATED_PROCESSING_MS = 900;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CONFIRMATION_COPY = {
  cod: (order) => (
    <>
      Please have {formatPrice(order.total)} ready in cash. We'll call {order.customer.phone} to confirm
      delivery to {order.shippingAddress.city}, {order.shippingAddress.governorate}.
    </>
  ),
  card: (order) => (
    <>
      Your card was charged {formatPrice(order.total)}. We'll call {order.customer.phone} to confirm
      delivery to {order.shippingAddress.city}, {order.shippingAddress.governorate}.
    </>
  ),
  wallet: (order) => (
    <>
      {formatPrice(order.total)} was paid from your wallet. We'll call {order.customer.phone} to confirm
      delivery to {order.shippingAddress.city}, {order.shippingAddress.governorate}.
    </>
  ),
};

function OrderPlaced({ order }) {
  const copy = CONFIRMATION_COPY[order.paymentMethod] ?? CONFIRMATION_COPY.cod;
  return (
    <div className="container py-5 text-center">
      <i className="bi bi-check-circle-fill fs-1 text-success" aria-hidden="true" />
      <h1 className="h3 mt-3">Order placed</h1>
      <p className="mb-1">
        Your order number is <strong>#{orderNumber(order.id)}</strong>.
      </p>
      <p className="text-secondary">{copy(order)}</p>
      <div className="d-flex flex-wrap justify-content-center gap-2">
        {order.userId ? (
          <Link to={`/orders/${order.id}`} className="btn btn-accent px-4">View order</Link>
        ) : (
          <span className="small text-secondary d-block mb-2 w-100">
            Guest order — <Link to="/register">create an account</Link> to track future orders here.
          </span>
        )}
        <Link to="/products" className="btn btn-outline-secondary px-4">Continue shopping</Link>
      </div>
    </div>
  );
}

export default function Checkout() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const cart = useSelector((s) => s.cart);
  const { coupon, discount: couponDiscount } = useSelector((s) => s.coupons);
  const { createStatus: status, createError: error } = useSelector((s) => s.orders);
  const [payment, setPayment] = useState("cod");
  const [paymentValid, setPaymentValid] = useState(true); // true for COD, tracked for card/wallet
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const loading = status === "loading" || processing;
  const appliedCoupon = coupon ? { code: coupon.code, discount: couponDiscount } : null;
  const { total } = getOrderTotals(cart, appliedCoupon);

  useEffect(() => {
    dispatch(resetCreateStatus()); // drop an old error from a previous visit
  }, [dispatch]);

  const handlePaymentChange = (method) => {
    setPayment(method);
    setPaymentDetails(null);
    setPaymentValid(method === "cod"); // card/wallet start invalid until their sub-form validates
  };

  const handlePlaceOrder = async (values) => {
    if (loading || cart.items.length === 0 || !paymentValid) return;

    // Card/wallet: simulate sending the (never-persisted) details to a gateway and getting an
    // authorization back. There's no real processor behind this — see CardForm/WalletForm.
    if (payment !== "cod") {
      setProcessing(true);
      await sleep(SIMULATED_PROCESSING_MS);
      setProcessing(false);
    }

    const order = {
      userId: user?.id ?? null, // guest checkout: no account required
      guest: !user,
      customer: {
        name: values.fullName,
        email: values.email.toLowerCase(),
        phone: values.phone.replace(/[\s-]/g, ""),
      },
      shippingAddress: {
        address: values.address,
        city: values.city,
        governorate: values.governorate,
        postalCode: values.postalCode,
        notes: values.notes,
      },
      items: cart.items.map((i) => ({
        productId: i.id,
        title: i.title,
        thumbnail: i.thumbnail,
        price: i.price,
        listPrice: i.listPrice,
        quantity: i.quantity,
        sellerId: i.sellerId ?? null,
      })),
      paymentMethod: payment,
      // COD is only "paid" on delivery; card/wallet are simulated as authorized immediately.
      paymentStatus: payment === "cod" ? "pending" : "paid",
      ...(payment === "card" && paymentDetails
        ? { paymentSummary: { brand: "card", last4: paymentDetails.number.replace(/\s+/g, "").slice(-4) } }
        : {}),
      ...(payment === "wallet" && paymentDetails
        ? { paymentSummary: { brand: "wallet", walletNumber: paymentDetails.walletNumber } }
        : {}),
      currency: "USD",
      ...getOrderTotals(cart, appliedCoupon),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await dispatch(createOrder(order)).unwrap();
      // placedOrder is checked before the "empty cart" branch below, so setting it here — before
      // clearing the cart — means that branch never gets a chance to render, even for one frame.
      setPlacedOrder(created);
      dispatch(clearCart());
      if (appliedCoupon) dispatch(redeemCoupon());
      dispatch(showSuccess(`Order #${orderNumber(created.id)} placed.`));
    } catch (err) {
      dispatch(showError(typeof err === "string" ? err : "Couldn't place your order. Please try again."));
    }
  };

  if (placedOrder) return <OrderPlaced order={placedOrder} />;

  if (cart.items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-bag fs-1 text-secondary" aria-hidden="true" />
        <h1 className="h4 mt-3">Your cart is empty</h1>
        <p className="text-secondary">Add something to your cart before checking out.</p>
        <Link to="/products" className="btn btn-accent px-4">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h3 mb-1">Checkout</h1>
      {!user && (
        <p className="text-secondary mb-4">
          Checking out as a guest. <Link to="/login" state={{ from: { pathname: "/checkout" } }}>Log in</Link>{" "}
          or <Link to="/register">create an account</Link> to save this info and track your order.
        </p>
      )}
      {user && <div className="mb-4" />}

      <div className="row g-4">
        <div className="col-lg-7">
          <section className="bg-white border rounded-4 p-4 mb-4">
            <h2 className="h5 mb-3">Shipping details</h2>
            <ShippingForm
              initialValues={{ fullName: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" }}
              onSubmit={handlePlaceOrder}
              disabled={loading}
            />
          </section>

          <section className="bg-white border rounded-4 p-4">
            <h2 className="h5 mb-3">Payment method</h2>
            <PaymentMethod
              value={payment}
              onChange={handlePaymentChange}
              onPaymentDetailsChange={(isValid, details) => {
                setPaymentValid(isValid);
                setPaymentDetails(details);
              }}
            />
          </section>
        </div>

        <div className="col-lg-5">
          <OrderSummary>
            {error && (
              <div className="alert alert-danger py-2 mt-4 mb-0" role="alert">
                {error}
              </div>
            )}
            <button
              type="submit"
              form="shipping-form"
              className="btn btn-accent btn-lg w-100 mt-4"
              disabled={loading || !paymentValid}
            >
              {processing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Processing payment...
                </>
              ) : loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Placing order...
                </>
              ) : (
                `Place order — ${formatPrice(total)}`
              )}
            </button>
            <Link to="/cart" className="btn btn-outline-secondary w-100 mt-2">
              Back to cart
            </Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
