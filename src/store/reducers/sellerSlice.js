import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as sellerApi from "../../api/sellerApi";
import { authSlice } from "./authSlice";

const makeThunk = (type, call) =>
  createAsyncThunk(type, async (arg, { rejectWithValue, signal }) => {
    try {
      return await call(arg, signal);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  });

export const fetchSellerProducts = makeThunk("seller/fetchProducts", (sellerId, signal) =>
  sellerApi.fetchSellerProducts(sellerId, signal)
);
export const createSellerProduct = makeThunk("seller/createProduct", (data) => sellerApi.createSellerProduct(data));
export const updateSellerProduct = makeThunk("seller/updateProduct", ({ id, data }) =>
  sellerApi.updateSellerProduct(id, data)
);
export const deleteSellerProduct = makeThunk("seller/deleteProduct", async (id) => {
  await sellerApi.deleteSellerProduct(id);
  return id;
});

// Fetches every order and keeps only the ones containing at least one of this seller's product
// ids (see sellerApi.fetchAllOrdersForFiltering for why this can't be a server-side filter).
export const fetchSellerOrders = createAsyncThunk(
  "seller/fetchOrders",
  async (sellerProductIds, { rejectWithValue, signal }) => {
    try {
      const all = await sellerApi.fetchAllOrdersForFiltering(signal);
      const idSet = new Set(sellerProductIds);
      return all.filter((order) => order.items?.some((item) => idSet.has(item.productId)));
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
export const updateSellerOrderStatus = makeThunk("seller/updateOrderStatus", ({ id, status }) =>
  sellerApi.updateOrderStatus(id, status)
);

export const applyForSeller = makeThunk("seller/apply", ({ userId, storeName }) =>
  sellerApi.applyForSeller(userId, storeName)
);

const initialState = {
  products: [],
  productsStatus: "idle", // idle | loading | succeeded | failed
  productsError: null,
  deletingProductIds: [],
  saveStatus: "idle", // create / update product form
  saveError: null,

  orders: [],
  ordersStatus: "idle",
  ordersError: null,
  updatingOrderIds: [],

  applyStatus: "idle", // "Become a seller" form
  applyError: null,

  actionError: null,
};

const errorOf = ({ payload, error }) => payload ?? error.message;
const without = (list, value) => list.filter((v) => v !== value);

export const sellerSlice = createSlice({
  name: "seller",
  initialState,
  reducers: {
    resetProductsStatus(state) {
      state.productsStatus = "idle";
      state.productsError = null;
    },
    resetSave(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
    resetOrdersStatus(state) {
      state.ordersStatus = "idle";
      state.ordersError = null;
    },
    resetApplyStatus(state) {
      state.applyStatus = "idle";
      state.applyError = null;
    },
    clearActionError(state) {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authSlice.actions.clearUser, () => initialState) // logout: drop this seller's data

      .addCase(fetchSellerProducts.pending, (state) => {
        state.productsStatus = "loading";
        state.productsError = null;
      })
      .addCase(fetchSellerProducts.fulfilled, (state, { payload }) => {
        state.productsStatus = "succeeded";
        state.products = payload;
      })
      .addCase(fetchSellerProducts.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.productsStatus = "failed";
        state.productsError = errorOf(action);
      })

      .addCase(createSellerProduct.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createSellerProduct.fulfilled, (state, { payload }) => {
        state.saveStatus = "succeeded";
        state.products.push(payload);
      })
      .addCase(createSellerProduct.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = errorOf(action);
      })

      .addCase(updateSellerProduct.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(updateSellerProduct.fulfilled, (state, { payload }) => {
        state.saveStatus = "succeeded";
        state.products = state.products.map((p) => (p.id === payload.id ? payload : p));
      })
      .addCase(updateSellerProduct.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = errorOf(action);
      })

      .addCase(deleteSellerProduct.pending, (state, { meta }) => {
        state.deletingProductIds.push(meta.arg);
        state.actionError = null;
      })
      .addCase(deleteSellerProduct.fulfilled, (state, { meta }) => {
        state.deletingProductIds = without(state.deletingProductIds, meta.arg);
        state.products = state.products.filter((p) => p.id !== meta.arg);
      })
      .addCase(deleteSellerProduct.rejected, (state, action) => {
        state.deletingProductIds = without(state.deletingProductIds, action.meta.arg);
        state.actionError = `Couldn't delete the product. ${errorOf(action)}`;
      })

      .addCase(fetchSellerOrders.pending, (state) => {
        state.ordersStatus = "loading";
        state.ordersError = null;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, { payload }) => {
        state.ordersStatus = "succeeded";
        state.orders = payload;
      })
      .addCase(fetchSellerOrders.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.ordersStatus = "failed";
        state.ordersError = errorOf(action);
      })

      .addCase(updateSellerOrderStatus.pending, (state, { meta }) => {
        state.updatingOrderIds.push(meta.arg.id);
        state.actionError = null;
      })
      .addCase(updateSellerOrderStatus.fulfilled, (state, { meta, payload }) => {
        state.updatingOrderIds = without(state.updatingOrderIds, meta.arg.id);
        state.orders = state.orders.map((o) => (o.id === payload.id ? payload : o));
      })
      .addCase(updateSellerOrderStatus.rejected, (state, action) => {
        state.updatingOrderIds = without(state.updatingOrderIds, action.meta.arg.id);
        state.actionError = `Couldn't update the order status. ${errorOf(action)}`;
      })

      .addCase(applyForSeller.pending, (state) => {
        state.applyStatus = "loading";
        state.applyError = null;
      })
      .addCase(applyForSeller.fulfilled, (state) => {
        state.applyStatus = "succeeded";
      })
      .addCase(applyForSeller.rejected, (state, action) => {
        state.applyStatus = "failed";
        state.applyError = errorOf(action);
      });
  },
});

export const { resetProductsStatus, resetSave, resetOrdersStatus, resetApplyStatus, clearActionError } =
  sellerSlice.actions;
export default sellerSlice.reducer;
