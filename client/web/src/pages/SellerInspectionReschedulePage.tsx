import { Navigate, useParams } from "react-router-dom";

export function SellerInspectionReschedulePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();

  if (!vehicleId) {
    return <Navigate replace to="/seller/vehicles" />;
  }

  return (
    <Navigate
      replace
      state={{ inspectionModal: "reschedule" }}
      to={`/seller/vehicles/${vehicleId}/detail/inspection-pending`}
    />
  );
}
