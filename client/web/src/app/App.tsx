import React from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";

import { useAuth } from "./AuthContext";
import { roleHomePath } from "./roleHome";
import { Layout } from "../components/Layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { DealerSignupCompletePage } from "../pages/DealerSignupCompletePage";
import { DealerBidsPage } from "../pages/DealerBidsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DealerMarketPage } from "../pages/DealerMarketPage";
import { DealerSignupPage } from "../pages/DealerSignupPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { SellerDeliverySettlementProgressPage } from "../pages/SellerDeliverySettlementProgressPage";
import { SellerDepreciationPage } from "../pages/SellerDepreciationPage";
import { SellerInspectionCompletedDetailPage } from "../pages/SellerInspectionCompletedDetailPage";
import { SellerImageViewerPage } from "../pages/SellerImageViewerPage";
import { SellerInspectionPendingDetailPage } from "../pages/SellerInspectionPendingDetailPage";
import { SellerInspectionReschedulePage } from "../pages/SellerInspectionReschedulePage";
import { SellerInspectionSchedulePage } from "../pages/SellerInspectionSchedulePage";
import { SellerSignupPage } from "../pages/SellerSignupPage";
import { SellerSignupCompletePage } from "../pages/SellerSignupCompletePage";
import { SellerVehicleBidsPage } from "../pages/SellerVehicleBidsPage";
import { SellerVehicleClosedDetailPage } from "../pages/SellerVehicleClosedDetailPage";
import { SellerVehicleDetailPage } from "../pages/SellerVehicleDetailPage";
import { SellerVehicleEditPage } from "../pages/SellerVehicleEditPage";
import { SellerVehicleRegisterConfirmPage } from "../pages/SellerVehicleRegisterConfirmPage";
import { SellerVehicleRegisterPage } from "../pages/SellerVehicleRegisterPage";
import { SellerVehicleWinnerSelectPage } from "../pages/SellerVehicleWinnerSelectPage";
import { SellerSettlementPage } from "../pages/SellerSettlementPage";
import { SellerVehiclesPage } from "../pages/SellerVehiclesPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SignupTypePage } from "../pages/SignupTypePage";
import { SupportFaqsPage } from "../pages/SupportFaqsPage";
import { SupportInquiryPage } from "../pages/SupportInquiryPage";
import { SupportPrivacyPolicyPage } from "../pages/SupportPrivacyPolicyPage";
import { SupportNoticeDetailPage } from "../pages/SupportNoticeDetailPage";
import { SupportNoticesPage } from "../pages/SupportNoticesPage";
import { DealerBidDetailPage } from "../pages/dealer/DealerBidDetailPage";
import { DealerBidEditPage } from "../pages/dealer/DealerBidEditPage";
import { DealerBidParticipatePage } from "../pages/dealer/DealerBidParticipatePage";
import { DealerDepreciationHistoryPage } from "../pages/dealer/DealerDepreciationHistoryPage";
import { DealerDepreciationInputPage } from "../pages/dealer/DealerDepreciationInputPage";
import { DealerFaqPage } from "../pages/dealer/DealerFaqPage";
import { DealerImageViewerPage } from "../pages/dealer/DealerImageViewerPage";
import { DealerInquiryPage } from "../pages/dealer/DealerInquiryPage";
import { DealerListingDetailPage } from "../pages/dealer/DealerListingDetailPage";
import { DealerNoticeDetailPage } from "../pages/dealer/DealerNoticeDetailPage";
import { DealerNoticesPage } from "../pages/dealer/DealerNoticesPage";
import { DealerReceiptProofPage } from "../pages/dealer/DealerReceiptProofPage";
import { DealerSettingsPage } from "../pages/dealer/DealerSettingsPage";
import { DealerTransactionDetailPage } from "../pages/dealer/DealerTransactionDetailPage";
import { DealerTransactionsPage } from "../pages/dealer/DealerTransactionsPage";

function MarketIndexRedirect() {
  const { token, user } = useAuth();

  if (token && user) {
    return <Navigate replace to={roleHomePath(user.role)} />;
  }

  return <LandingPage />;
}

type RedirectParams = Record<string, string | undefined>;

const sellerParamRedirects: Array<{ path: string; buildTo: (params: RedirectParams) => string }> = [
  {
    path: "seller/vehicles/:vehicleId/depreciation/completed",
    buildTo: ({ vehicleId }) => `/seller/vehicles/${vehicleId}/depreciation`,
  },
  {
    path: "seller/vehicles/:vehicleId/depreciation/renegotiation",
    buildTo: ({ vehicleId }) => `/seller/vehicles/${vehicleId}/depreciation`,
  },
  {
    path: "seller/vehicles/:vehicleId/detail/depreciation-pending",
    buildTo: ({ vehicleId }) => `/seller/vehicles/${vehicleId}/depreciation`,
  },
  {
    path: "seller/vehicles/:vehicleId/detail/depreciation-completed",
    buildTo: ({ vehicleId }) => `/seller/vehicles/${vehicleId}/depreciation`,
  },
  {
    path: "seller/vehicles/:vehicleId/detail/completed",
    buildTo: ({ vehicleId }) => `/seller/vehicles/${vehicleId}`,
  },
  {
    path: "seller/vehicles/:vehicleId/detail/delivery-settlement",
    buildTo: ({ vehicleId }) => `/seller/vehicles/${vehicleId}/delivery-settlement-progress`,
  },
  {
    path: "seller/vehicles/:vehicleId/delivery-settlement-progress/detail",
    buildTo: ({ vehicleId }) => `/seller/vehicles/${vehicleId}/delivery-settlement-progress`,
  },
  {
    path: "seller/settlement/pending/:vehicleId",
    buildTo: ({ vehicleId }) => `/seller/settlement?view=pending&id=${vehicleId}`,
  },
  {
    path: "seller/settlement/completed/:vehicleId",
    buildTo: ({ vehicleId }) => `/seller/settlement?view=completed&id=${vehicleId}`,
  },
  {
    path: "seller/support/notices/:noticeId",
    buildTo: ({ noticeId }) => `/support/notices/${noticeId}`,
  },
];

function ParamRedirect({ buildTo }: { buildTo: (params: RedirectParams) => string }) {
  const params = useParams();
  return <Navigate replace to={buildTo(params)} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<MarketIndexRedirect />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="signup" element={<SignupTypePage />} />
        <Route path="signup/seller" element={<SellerSignupPage />} />
        <Route path="signup/seller/complete" element={<SellerSignupCompletePage />} />
        <Route path="signup/dealer" element={<DealerSignupPage />} />
        <Route path="signup/dealer/complete" element={<DealerSignupCompletePage />} />
        <Route path="support/notices" element={<SupportNoticesPage />} />
        <Route path="support/notices/:noticeId" element={<SupportNoticeDetailPage />} />
        <Route path="support/faqs" element={<SupportFaqsPage />} />
        <Route path="support/privacy-policy" element={<SupportPrivacyPolicyPage />} />
        <Route
          path="support/inquiries"
          element={
            <ProtectedRoute>
              <SupportInquiryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/account"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/settlement"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/settlement/edit"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/settlement/empty"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/notifications"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/security"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/locale"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/terms"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/support/notices"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SupportNoticesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/support/notices/:noticeId"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SupportNoticeDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerVehiclesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/initial"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerVehiclesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/register"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerVehicleRegisterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/register/confirm"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerVehicleRegisterConfirmPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/new"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <Navigate replace to="/seller/vehicles/register" />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/new/confirm"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <Navigate replace to="/seller/vehicles/register/confirm" />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/:vehicleId"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerVehicleDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/:vehicleId/edit"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerVehicleEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/:vehicleId/winner"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerVehicleWinnerSelectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/:vehicleId/detail/closed"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerVehicleClosedDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/:vehicleId/detail/inspection-pending"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerInspectionPendingDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/:vehicleId/detail/inspection-completed"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerInspectionCompletedDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/:vehicleId/inspection"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerInspectionSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/:vehicleId/inspection/reschedule"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerInspectionReschedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/:vehicleId/depreciation"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerDepreciationPage />
            </ProtectedRoute>
          }
        />
        {sellerParamRedirects.map((redirect) => (
          <Route
            key={redirect.path}
            path={redirect.path}
            element={
              <ProtectedRoute allow={["SELLER"]}>
                <ParamRedirect buildTo={redirect.buildTo} />
              </ProtectedRoute>
            }
          />
        ))}
        <Route
          path="seller/vehicles/:vehicleId/delivery-settlement-progress"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerDeliverySettlementProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/:vehicleId/bids"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerVehicleBidsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/vehicles/:vehicleId/images"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerImageViewerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/market"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerMarketPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/market/:vehicleId"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerListingDetailPage tab="info" />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/market/:vehicleId/photos"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerListingDetailPage tab="photos" />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/market/:vehicleId/inspection"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerListingDetailPage tab="inspection" />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/market/:vehicleId/terms"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerListingDetailPage tab="terms" />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/market/:vehicleId/image"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerImageViewerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/market/:vehicleId/bid"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerBidParticipatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/bids"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerBidsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/bids/:vehicleId/edit"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerBidEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/bids/:vehicleId/detail/:state"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerBidDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/transactions"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerTransactionsPage mode="progress" />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/transactions/completed"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerTransactionsPage mode="completed" />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/transactions/:vehicleId/receipt"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerReceiptProofPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/transactions/:vehicleId/depreciation"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerDepreciationInputPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/transactions/:vehicleId/depreciation/history"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerDepreciationHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/transactions/:vehicleId/detail/:stage"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerTransactionDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/settings/account"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerSettingsPage tab="account" />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/settings/business-docs"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerSettingsPage tab="business" />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/settings/notifications"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerSettingsPage tab="notifications" />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/settings/security"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerSettingsPage tab="security" />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/settings/terms"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerSettingsPage tab="terms" />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/support/faqs"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerFaqPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/support/notices"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerNoticesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/support/notices/:noticeId"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerNoticeDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dealer/support/inquiries"
          element={
            <ProtectedRoute allow={["DEALER"]}>
              <DealerInquiryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/settlement"
          element={
            <ProtectedRoute allow={["SELLER"]}>
              <SellerSettlementPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
