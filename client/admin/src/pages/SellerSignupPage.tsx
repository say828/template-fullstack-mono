import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerSeller } from "../lib/api";
import { AuthScaffold } from "../components/auth/AuthScaffold";
import { SocialLoginButtons } from "../components/auth/SocialLoginButtons";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function SellerSignupPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    password_confirm: "",
    phone: "",
    country: "KR",
  });
  const [terms, setTerms] = useState({
    service: false,
    privacy: false,
    marketing: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isValidName = form.full_name.trim().length >= 2;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const isValidPassword = form.password.length >= 8;
  const isPasswordMatch = form.password === form.password_confirm && form.password_confirm.length > 0;
  const hasRequiredTerms = terms.service && terms.privacy;
  const canSubmit = isValidName && isValidEmail && isValidPassword && isPasswordMatch && hasRequiredTerms;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setError("필수 입력과 약관 동의 항목을 확인해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setSocialMessage(null);
    try {
      await registerSeller({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        country: form.country.trim() || undefined,
      });
      navigate("/signup/seller/complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold activeAction="signup">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-5 p-7">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-black text-slate-900">판매자 회원가입</h1>
            <p className="text-sm text-slate-500">필수 정보를 입력하고 판매자 계정을 생성해 주세요.</p>
          </div>

          <form className="space-y-3" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="seller-full-name">이름</Label>
              <Input
                id="seller-full-name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
              <p className={`text-xs ${isValidName ? "text-muted-foreground" : "text-destructive"}`}>
                2자 이상 입력해 주세요.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller-email">이메일</Label>
              <Input
                id="seller-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="로그인에 사용할 이메일을 입력하세요"
                required
              />
              <p className={`text-xs ${isValidEmail ? "text-muted-foreground" : "text-destructive"}`}>
                올바른 이메일 형식이어야 합니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller-password">비밀번호</Label>
              <Input
                id="seller-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                placeholder="비밀번호"
                required
              />
              <p className={`text-xs ${isValidPassword ? "text-muted-foreground" : "text-destructive"}`}>
                8자 이상 입력해 주세요.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller-password-confirm">비밀번호 확인</Label>
              <Input
                id="seller-password-confirm"
                type="password"
                value={form.password_confirm}
                onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                minLength={8}
                placeholder="비밀번호 확인"
                required
              />
              <p className={`text-xs ${isPasswordMatch ? "text-muted-foreground" : "text-destructive"}`}>
                비밀번호가 일치해야 합니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller-phone">휴대폰</Label>
              <Input
                id="seller-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="숫자만 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller-country">국가</Label>
              <select
                id="seller-country"
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              >
                <option value="KR">대한민국 (KR)</option>
                <option value="US">미국 (US)</option>
                <option value="JP">일본 (JP)</option>
                <option value="VN">베트남 (VN)</option>
              </select>
            </div>

            <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="seller-term-service"
                  checked={terms.service}
                  onCheckedChange={(checked) => setTerms((prev) => ({ ...prev, service: checked === true }))}
                />
                <Label htmlFor="seller-term-service">[필수] 서비스 이용약관 동의</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="seller-term-privacy"
                  checked={terms.privacy}
                  onCheckedChange={(checked) => setTerms((prev) => ({ ...prev, privacy: checked === true }))}
                />
                <Label htmlFor="seller-term-privacy">[필수] 개인정보 처리방침 동의</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="seller-term-marketing"
                  checked={terms.marketing}
                  onCheckedChange={(checked) => setTerms((prev) => ({ ...prev, marketing: checked === true }))}
                />
                <Label htmlFor="seller-term-marketing">[선택] 마케팅 정보 수신 동의</Label>
              </div>
              <p className={`text-xs ${hasRequiredTerms ? "text-muted-foreground" : "text-destructive"}`}>
                필수 약관 동의가 필요합니다.
              </p>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>가입 실패</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button className="h-11 w-full rounded-md bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={loading || !canSubmit} type="submit">
              {loading ? "처리 중..." : "가입 완료"}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400">다른 방법으로 로그인하기</span>
            </div>
          </div>

          <SocialLoginButtons
            onClick={(provider) => {
              setSocialMessage(provider === "google" ? "구글 로그인은 DEV에서 준비 중입니다." : "네이버 로그인은 DEV에서 준비 중입니다.");
            }}
          />

          {socialMessage && (
            <Alert>
              <AlertTitle>안내</AlertTitle>
              <AlertDescription>{socialMessage}</AlertDescription>
            </Alert>
          )}

          <p className="text-center text-sm text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link className="font-semibold text-[#2f6ff5] hover:text-[#2459cd]" to="/login?role=seller">
              로그인하기
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthScaffold>
  );
}
