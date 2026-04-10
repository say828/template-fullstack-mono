import { Button } from "../ui/button";

export function SocialLoginButtons({ onClick }: { onClick: (provider: "google" | "naver") => void }) {
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full justify-center rounded-md border-slate-300 bg-white text-slate-700"
        onClick={() => onClick("google")}
      >
        구글로 로그인하기
      </Button>
      <Button
        type="button"
        className="h-11 w-full justify-center rounded-md bg-[#03c75a] text-white hover:bg-[#02b34f]"
        onClick={() => onClick("naver")}
      >
        네이버로 시작하기
      </Button>
    </div>
  );
}
