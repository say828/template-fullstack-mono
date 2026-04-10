import { Link } from "react-router-dom";

interface DealerSupportNavProps {
  active: "faqs" | "notices" | "inquiries";
}

const navItems = [
  { key: "faqs", label: "자주 묻는 질문", to: "/dealer/support/faqs" },
  { key: "notices", label: "공지사항", to: "/dealer/support/notices" },
  { key: "inquiries", label: "1:1 문의", to: "/dealer/support/inquiries" },
] as const;

export function DealerSupportNav({ active }: DealerSupportNavProps) {
  return (
    <aside className="h-fit rounded-xl border border-slate-200 bg-white">
      {navItems.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          className={`block border-l-2 px-4 py-3 text-sm ${
            active === item.key ? "border-l-[#2f6ff5] bg-[#edf3ff] font-semibold text-[#2f6ff5]" : "border-l-transparent text-slate-600 hover:bg-slate-50"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </aside>
  );
}
