import { FormEvent, useState } from "react";
import { Building2, FileCheck2, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { registerDealer } from "../lib/api";
import { AuthScaffold } from "../components/auth/AuthScaffold";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function DealerSignupPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    password_confirm: "",
    phone: "",
    country: "KR",
    business_number: "",
  });
  const [files, setFiles] = useState<{
    business_license: File | null;
    dealer_license: File | null;
    id_card: File | null;
  }>({
    business_license: null,
    dealer_license: null,
    id_card: null,
  });
  const [terms, setTerms] = useState({
    service: false,
    privacy: false,
  });
  const [fileErrors, setFileErrors] = useState<{
    business_license?: string;
    dealer_license?: string;
    id_card?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isValidName = form.full_name.trim().length >= 2;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const isValidPassword = form.password.length >= 8;
  const isPasswordMatch = form.password === form.password_confirm && form.password_confirm.length > 0;
  const isBusinessNumberFilled = form.business_number.trim().length >= 5;
  const hasFiles = Boolean(files.business_license && files.dealer_license && files.id_card);
  const hasRequiredTerms = terms.service && terms.privacy;
  const canSubmit =
    isValidName && isValidEmail && isValidPassword && isPasswordMatch && isBusinessNumberFilled && hasFiles && hasRequiredTerms;

  const validateUpload = (key: "business_license" | "dealer_license" | "id_card", file: File | null) => {
    if (!file) {
      setFileErrors((prev) => ({ ...prev, [key]: "파일을 선택해 주세요." }));
      setFiles((prev) => ({ ...prev, [key]: null }));
      return;
    }
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    const lower = file.name.toLowerCase();
    if (!allowed.some((ext) => lower.endsWith(ext))) {
      setFileErrors((prev) => ({ ...prev, [key]: "PDF/JPG/PNG 파일만 업로드할 수 있습니다." }));
      setFiles((prev) => ({ ...prev, [key]: null }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileErrors((prev) => ({ ...prev, [key]: "파일 용량은 10MB 이하여야 합니다." }));
      setFiles((prev) => ({ ...prev, [key]: null }));
      return;
    }

    setFileErrors((prev) => ({ ...prev, [key]: undefined }));
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setError("필수 입력, 첨부 서류, 약관 동의 항목을 확인해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("full_name", form.full_name.trim());
      formData.set("email", form.email.trim());
      formData.set("password", form.password);
      formData.set("phone", form.phone.trim());
      formData.set("country", form.country.trim());
      formData.set("business_number", form.business_number.trim());
      formData.set("business_license", files.business_license as File);
      formData.set("dealer_license", files.dealer_license as File);
      formData.set("id_card", files.id_card as File);

      await registerDealer(formData);
      navigate("/signup/dealer/complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "딜러 가입 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold activeAction="signup" maxWidthClass="max-w-lg">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-5 p-7">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-black text-slate-900">딜러 회원가입</h1>
            <p className="text-sm text-slate-500">서류 정보를 입력하고 딜러 계정 등록을 진행해 주세요.</p>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <section className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#edf3ff] px-3 py-1 text-xs font-semibold text-[#2f6ff5]">
                <Building2 className="h-3.5 w-3.5" />
                기본 정보
              </div>
            <div className="space-y-2">
              <Label htmlFor="dealer-full-name">이름</Label>
              <Input
                id="dealer-full-name"
                value={form.full_name}
                onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="이름을 입력하세요"
                required
              />
              <p className={`text-xs ${isValidName ? "text-muted-foreground" : "text-destructive"}`}>2자 이상 입력해 주세요.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealer-email">이메일</Label>
              <Input
                id="dealer-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="로그인에 사용할 이메일을 입력하세요"
                required
              />
              <p className={`text-xs ${isValidEmail ? "text-muted-foreground" : "text-destructive"}`}>
                올바른 이메일 형식이어야 합니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealer-password">비밀번호</Label>
              <Input
                id="dealer-password"
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="비밀번호 입력"
                required
              />
              <p className={`text-xs ${isValidPassword ? "text-muted-foreground" : "text-destructive"}`}>8자 이상 입력해 주세요.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealer-password-confirm">비밀번호 확인</Label>
              <Input
                id="dealer-password-confirm"
                type="password"
                minLength={8}
                value={form.password_confirm}
                onChange={(e) => setForm((prev) => ({ ...prev, password_confirm: e.target.value }))}
                placeholder="비밀번호 확인"
                required
              />
              <p className={`text-xs ${isPasswordMatch ? "text-muted-foreground" : "text-destructive"}`}>
                비밀번호가 일치해야 합니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealer-phone">휴대폰</Label>
              <Input
                id="dealer-phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="숫자만 입력하세요"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealer-country">국가</Label>
              <select
                id="dealer-country"
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
                value={form.country}
                onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              >
                <option value="KR">대한민국 (KR)</option>
                <option value="US">미국 (US)</option>
                <option value="JP">일본 (JP)</option>
                <option value="VN">베트남 (VN)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealer-business-number">사업자번호</Label>
              <Input
                id="dealer-business-number"
                value={form.business_number}
                onChange={(e) => setForm((prev) => ({ ...prev, business_number: e.target.value }))}
                placeholder="사업자번호를 입력하세요"
                required
              />
              <p className={`text-xs ${isBusinessNumberFilled ? "text-muted-foreground" : "text-destructive"}`}>
                사업자번호를 입력해 주세요.
              </p>
            </div>
            </section>

            <section className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#edf3ff] px-3 py-1 text-xs font-semibold text-[#2f6ff5]">
                <FileCheck2 className="h-3.5 w-3.5" />
                서류 첨부
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealer-business-license">사업자등록증</Label>
                <Input
                  id="dealer-business-license"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => validateUpload("business_license", e.currentTarget.files?.[0] ?? null)}
                  required
                />
                {fileErrors.business_license && <p className="text-xs text-destructive">{fileErrors.business_license}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealer-license">매매사원증</Label>
                <Input
                  id="dealer-license"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => validateUpload("dealer_license", e.currentTarget.files?.[0] ?? null)}
                  required
                />
                {fileErrors.dealer_license && <p className="text-xs text-destructive">{fileErrors.dealer_license}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealer-id-card">신분증</Label>
                <Input
                  id="dealer-id-card"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => validateUpload("id_card", e.currentTarget.files?.[0] ?? null)}
                  required
                />
                {fileErrors.id_card && <p className="text-xs text-destructive">{fileErrors.id_card}</p>}
              </div>
              <p className={`text-xs ${hasFiles ? "text-muted-foreground" : "text-destructive"}`}>
                3개 서류 모두 첨부해야 합니다.
              </p>
            </section>

            <section className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dealer-term-service"
                  checked={terms.service}
                  onCheckedChange={(checked) => setTerms((prev) => ({ ...prev, service: checked === true }))}
                />
                <Label htmlFor="dealer-term-service">[필수] 서비스 이용약관 동의</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dealer-term-privacy"
                  checked={terms.privacy}
                  onCheckedChange={(checked) => setTerms((prev) => ({ ...prev, privacy: checked === true }))}
                />
                <Label htmlFor="dealer-term-privacy">[필수] 개인정보 처리방침 동의</Label>
              </div>
              <p className={`text-xs ${hasRequiredTerms ? "text-muted-foreground" : "text-destructive"}`}>
                필수 약관 동의가 필요합니다.
              </p>
            </section>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>가입 실패</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button className="h-11 w-full rounded-md bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={loading || !canSubmit} type="submit">
              {loading ? "처리 중..." : "가입 요청 제출"}
            </Button>
          </form>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            <span>서류 심사 결과는 이메일로 안내됩니다.</span>
          </div>

          <p className="text-center text-sm text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link className="font-semibold text-[#2f6ff5] hover:text-[#2459cd]" to="/login?role=dealer">
              로그인하기
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthScaffold>
  );
}
