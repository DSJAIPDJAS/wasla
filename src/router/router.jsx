import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ErrorPage from "../components/common/ErrorPage";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Products from "../pages/Products";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import OrderDetails from "../pages/OrderDetails";
import Wishlist from "../pages/Wishlist";
import Profile from "../pages/Profile";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminProductForm from "../pages/admin/AdminProductForm";
import AdminReviews from "../pages/admin/AdminReviews";
import AdminCoupons from "../pages/admin/AdminCoupons";
import AdminCouponForm from "../pages/admin/AdminCouponForm";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminCategoryForm from "../pages/admin/AdminCategoryForm";
import AdminBanners from "../pages/admin/AdminBanners";
import AdminBannerForm from "../pages/admin/AdminBannerForm";
import SellerLayout from "../layouts/SellerLayout";
import SellerDashboard from "../pages/seller/SellerDashboard";
import SellerProducts from "../pages/seller/SellerProducts";
import SellerProductForm from "../pages/seller/SellerProductForm";
import SellerOrders from "../pages/seller/SellerOrders";
import ProductDetails from "../pages/ProductDetails";
import Category from "../pages/Category";
import Offers from "../pages/Offers";
import Search from "../pages/Search";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "products", element: <Products /> },
      { path: "products/:id", element: <ProductDetails /> },
      { path: "category/:slug", element: <Category /> },
      { path: "offers", element: <Offers /> },
      { path: "search", element: <Search /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> }, // guest checkout: no login required
      {
        // everything below needs a logged-in user (any role)
        element: <ProtectedRoute />,
        children: [
          { path: "orders", element: <Orders /> },
          { path: "orders/:id", element: <OrderDetails /> },
          { path: "wishlist", element: <Wishlist /> },
          { path: "profile", element: <Profile /> },
        ],
      },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "products", element: <AdminProducts /> },
      { path: "products/new", element: <AdminProductForm /> },
      { path: "products/:id/edit", element: <AdminProductForm /> },
      { path: "categories", element: <AdminCategories /> },
      { path: "categories/new", element: <AdminCategoryForm /> },
      { path: "categories/:id/edit", element: <AdminCategoryForm /> },
      { path: "reviews", element: <AdminReviews /> },
      { path: "coupons", element: <AdminCoupons /> },
      { path: "coupons/new", element: <AdminCouponForm /> },
      { path: "coupons/:id/edit", element: <AdminCouponForm /> },
      { path: "banners", element: <AdminBanners /> },
      { path: "banners/new", element: <AdminBannerForm /> },
      { path: "banners/:id/edit", element: <AdminBannerForm /> },
      { path: "users", element: <AdminUsers /> },
    ],
  },
  {
    path: "/seller",
    element: (
      <ProtectedRoute roles={["seller"]}>
        <SellerLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <SellerDashboard /> },
      { path: "products", element: <SellerProducts /> },
      { path: "products/new", element: <SellerProductForm /> },
      { path: "products/:id/edit", element: <SellerProductForm /> },
      { path: "orders", element: <SellerOrders /> },
    ],
  },
  { path: "*", element: <ErrorPage /> },
]);

export default router;
