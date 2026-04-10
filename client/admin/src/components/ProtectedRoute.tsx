import { Navigate } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { roleHomePath } from "../app/roleHome";
import { isAdminConsoleHost } from "../app/runtime";
import { Card, CardContent } from "./ui/card";
import type { UserRole } from "../lib/types";

export function ProtectedRoute({
  children,
  allow,
}: {
  children: JSX.Element;
  allow?: UserRole[];
}) {
  const { user, token } = useAuth();
  const adminHost = isAdminConsoleHost();

  if (!token) {
    return <Navigate to={adminHost ? "/login" : "/login"} replace />;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">사용자 정보를 불러오는 중...</CardContent>
        </Card>
      </div>
    );
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to={roleHomePath(user.role, { adminHost })} replace />;
  }

  return children;
}
