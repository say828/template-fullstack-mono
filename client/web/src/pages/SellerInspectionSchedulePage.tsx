import { Navigate, useParams } from "react-router-dom";

export function SellerInspectionSchedulePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();

  if (!vehicleId) {
    return <Navigate replace to="/seller/vehicles" />;
  }

  return (
    <Navigate
      replace
      state={{ inspectionModal: "info" }}
      to={`/seller/vehicles/${vehicleId}/detail/inspection-pending`}
    />
  );
}
