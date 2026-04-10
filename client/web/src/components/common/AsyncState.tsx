import React from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface AsyncStateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
}

export function AsyncState({ loading, error, empty, emptyText = "데이터가 없습니다." }: AsyncStateProps) {
  if (loading) return <p className="text-sm text-muted-foreground">불러오는 중...</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>요청 실패</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (empty) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return null;
}
