import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <section className="mx-auto max-w-3xl">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>대시보드</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>{user.full_name}</span>
            <Badge variant="outline">{user.role}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {user.role === "SELLER" && (
            <>
              <p className="text-sm text-muted-foreground">판매자 기능: 차량/입찰/정산/고객지원/설정</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/seller/vehicles">내 차량 관리</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/seller/settlement">정산 관리</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/support/inquiries">1:1 문의</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings">설정</Link>
                </Button>
              </div>
            </>
          )}
          {user.role === "DEALER" && (
            <>
              <p className="text-sm text-muted-foreground">딜러 기능: 매물 조회/입찰/문의/알림/설정</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/dealer/market">매물 보기</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/dealer/bids">나의 입찰</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/support/inquiries">1:1 문의</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings">설정</Link>
                </Button>
              </div>
            </>
          )}
          {user.role === "ADMIN" && (
            <>
              <p className="text-sm text-muted-foreground">관리자 기능: 딜러 심사/정산 관리/고객지원 콘텐츠 운영</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/admin/dealers">딜러 승인 관리</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/settlements">판매자 정산 관리</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/support/notices">공지 관리</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
