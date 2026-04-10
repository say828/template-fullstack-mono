import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Car,
  CarFront,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  DollarSign,
  Globe2,
  Search,
  SearchCheck,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import "./landing.css";

interface RoleCard {
  title: string;
  description: string;
  items: string[];
  cta: string;
  to: string;
  icon: LucideIcon;
  dark?: boolean;
}

interface ValueCard {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface ProcessStep {
  title: string;
  description: string;
}

const roleCards: RoleCard[] = [
  {
    title: "판매자로 이용하기",
    description: "내 차를 가장 높은 가격에 판매하고 싶다면",
    items: ["차량번호 자동 조회", "국내/해외 딜러 TOP 10 입찰가", "검차·송금·수출 지원"],
    cta: "판매자 회원가입",
    to: "/signup/seller",
    icon: CarFront,
  },
  {
    title: "딜러로 이용하기",
    description: "전 세계의 매물을 빠르고 안전하게 확보하려면",
    items: ["글로벌 실시간 경매 참여", "국내·해외 딜러 지원", "검차·평가·수출 제공"],
    cta: "딜러 회원가입",
    to: "/signup/dealer",
    icon: UserCircle2,
    dark: true,
  },
];

const valueCards: ValueCard[] = [
  {
    title: "글로벌 딜러 네트워크",
    description: "전 세계 50개국 이상의 검증된 딜러와 연결됩니다.",
    icon: Globe2,
  },
  {
    title: "자동 차량 조회",
    description: "차량 번호만으로 상세 제원과 이력을 확인합니다.",
    icon: SearchCheck,
  },
  {
    title: "전문 검차 서비스",
    description: "전문 평가사가 직접 방문하여 차량 상태를 진단합니다.",
    icon: ClipboardCheck,
  },
  {
    title: "해외송금 & 수출 지원",
    description: "복잡한 서류 작업부터 송금까지 원스톱으로 해결합니다.",
    icon: DollarSign,
  },
  {
    title: "투명한 거래 절차",
    description: "모든 과정이 실시간으로 기록되어 안전하게 거래합니다.",
    icon: ShieldCheck,
  },
];

const processSteps: ProcessStep[] = [
  {
    title: "매물 입찰",
    description: "해외 딜러가 국내 매물에 자유롭게 입찰",
  },
  {
    title: "Template 검차사 평가",
    description: "Template 평가사 또는 협력 센터 검차 지원",
  },
  {
    title: "판매자와 감가 협의",
    description: "검차 결과 기반 감가 협의 진행",
  },
  {
    title: "해외딜러 -> Template 송금",
    description: "안전한 해외 송금 절차 지원",
  },
  {
    title: "Template -> 판매자 송금",
    description: "검증 후 판매자에게 대금 지급",
  },
  {
    title: "수출 서류 발급 / 선적 진행",
    description: "서류 발급 · 선적 · 통관 처리",
  },
  {
    title: "도착 후 차량 인도",
    description: "해외 딜러가 현지에서 차량 인수",
  },
];

const companyLinks = [
  { label: "회사소개", to: "/support/notices" },
  { label: "이용약관", to: "/support/notices" },
  { label: "개인정보처리방침", to: "/support/notices" },
  { label: "고객센터", to: "/support/faqs" },
];

const socialLinks = [
  { label: "f", href: "https://www.facebook.com/" },
  { label: "t", href: "https://www.threads.net/" },
  { label: "in", href: "https://www.linkedin.com/" },
  { label: "y", href: "https://www.youtube.com/" },
];

export function LandingPage() {
  const { user } = useAuth();
  const isGuest = !user;

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-shell landing-header-inner">
          <Link to="/" className="landing-logo">
            Template
          </Link>
          {isGuest && (
            <div className="landing-auth-actions">
              <Link className="landing-login-link" to="/login">
                <UserCircle2 size={14} />
                로그인
              </Link>
              <Link className="landing-signup-link" to="/signup">
                회원가입
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-shell landing-hero-inner">
          <p className="landing-chip">
            GLOBAL AUTO AUCTION
          </p>
          <h1 className="landing-title">
            글로벌 중고차 경매 플랫폼
              <strong>Template</strong>
          </h1>
          <p className="landing-hero-description">
            판매자는 차량 등록만 하면 전 세계 딜러의 입찰을 받을 수 있고,
            <br />
            딜러는 실시간으로 모든 매물에 입찰할 수 있습니다.
          </p>
          {isGuest && (
            <div className="landing-hero-actions">
              <Link className="landing-btn landing-btn-primary" to="/login?role=seller">
                차량 판매하기
              </Link>
              <Link className="landing-btn landing-btn-secondary" to="/login?role=dealer">
                딜러로 입찰하기
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="landing-role-section">
        <div className="landing-shell landing-role-inner">
          <div className="landing-section-head">
            <h2 className="landing-section-title">어떤 역할로 Template를 이용하시겠습니까?</h2>
            <p className="landing-section-description">고객님의 목적에 맞는 최적의 서비스를 제공합니다.</p>
          </div>
          <div className="landing-role-grid">
            {roleCards.map((item) => {
              const Icon = item.icon;
              return (
                <article className={`landing-role-card ${item.dark ? "is-dark" : ""}`} key={item.title}>
                  <div className="landing-role-icon">
                    <Icon size={18} />
                  </div>
                  <h3 className="landing-role-title">{item.title}</h3>
                  <p className="landing-role-description">{item.description}</p>
                  <ul className="landing-role-points">
                    {!item.dark && <Car className="landing-role-watermark-car" size={52} />}
                    {item.dark && <Search className="landing-role-watermark-search" size={50} />}

                    {item.items.map((point) => (
                      <li key={point}>
                        <CheckCircle2 className="landing-point-icon" size={14} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  {isGuest && (
                    <Link className={`landing-role-cta ${item.dark ? "is-dark" : ""}`} to={item.to}>
                      {item.cta}
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-value-section">
        <div className="landing-shell landing-value-inner">
          <div className="landing-section-head">
            <p className="landing-value-kicker">Why Choose Us</p>
            <h2 className="landing-section-title">Template가 제공하는 가치</h2>
          </div>
          <div className="landing-value-grid">
            {valueCards.map((item) => {
              const Icon = item.icon;
              return (
                <article className="landing-value-card" key={item.title}>
                  <span className="landing-value-icon">
                    <Icon size={15} />
                  </span>
                  <h3 className="landing-value-title">{item.title}</h3>
                  <p className="landing-value-description">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-process-section">
        <div className="landing-shell landing-process-inner">
          <div className="landing-section-head">
            <h2 className="landing-section-title">해외 딜러를 위한 원스톱 수출 서비스</h2>
          </div>

          <ol className="landing-process-list">
            {processSteps.map((step, index) => (
              <li className="landing-process-item" key={step.title}>
                <span className="landing-process-index">{index + 1}</span>
                {index < processSteps.length - 1 && <span className="landing-process-arrow">→</span>}
                <p className="landing-process-title">{step.title}</p>
                <p className="landing-process-description">{step.description}</p>
              </li>
            ))}
          </ol>

          {isGuest && (
            <div className="landing-process-action">
              <Link className="landing-guide-link" to="/support/notices">
                해외 딜러 가이드 보기
              </Link>
            </div>
          )}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <div className="landing-footer-left">
            <p className="landing-footer-logo">Template</p>
            <p className="landing-footer-links">
              {companyLinks.map((item, index) => (
                <span key={item.label}>
                  <Link to={item.to}>{item.label}</Link>
                  {index < companyLinks.length - 1 ? " · " : ""}
                </span>
              ))}
            </p>
            <p className="landing-footer-meta">사업자등록번호 123-45-67890 | 대표이사 홍길동</p>
            <p className="landing-footer-meta">주소: 서울특별시 강남구 테헤란로 123</p>
            <p className="landing-footer-meta">이메일: contact@template.com | 고객센터: 1588-0000</p>
          </div>
          <div className="landing-footer-right">
            <div className="landing-social-list">
              {socialLinks.map((item) => (
                <a key={item.label} className="landing-social-item" href={item.href} rel="noreferrer" target="_blank">
                  {item.label}
                </a>
              ))}
            </div>
            <p className="landing-copyright">© 2026 Template Corp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
