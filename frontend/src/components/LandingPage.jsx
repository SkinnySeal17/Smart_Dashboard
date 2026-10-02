import { Link } from "react-router-dom";
// The preview figures below are illustrative sample data, not a real account.

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  width: 22,
  height: 22,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const FEATURES = [
  {
    title: "All your services in one place",
    text: "Add every subscription and recurring service, then search and filter them in seconds.",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    title: "Spending at a glance",
    text: "See what you pay each month and an estimate for the whole year, worked out for you.",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 5-6" />
      </svg>
    ),
  },
  {
    title: "Never miss a renewal",
    text: "Upcoming renewals are listed ahead of time, and overdue ones are flagged straight away.",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    ),
  },
  {
    title: "Organised by category",
    text: "Group services with your own categories and colours, and see where your money goes.",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
        <circle cx="7.5" cy="7.5" r="1.5" />
      </svg>
    ),
  },
];

const STEPS = [
  { title: "Create your account", text: "Sign up free with your name and email." },
  { title: "Add your services", text: "Enter the cost, billing cycle and renewal date." },
  { title: "Check your dashboard", text: "Totals, charts and renewals update for you." },
];

const PREVIEW_BARS = [
  { name: "Consulting", width: 100, color: "#16a34a" },
  { name: "Web", width: 46, color: "#aa3bff" },
  { name: "Design", width: 28, color: "#3b82f6" },
];

function DashboardPreview() {
  return (
    <div className="landing-preview" aria-hidden="true">
      <div className="landing-preview__bar">
        <span />
        <span />
        <span />
      </div>
      <div className="landing-preview__body">
        <div className="landing-preview__stats">
          <div className="landing-preview__stat">
            <span>Monthly spend</span>
            <strong>$1,045</strong>
          </div>
          <div className="landing-preview__stat">
            <span>Yearly estimate</span>
            <strong>$12,543</strong>
          </div>
          <div className="landing-preview__stat">
            <span>Next renewal</span>
            <strong>Oct 3</strong>
          </div>
        </div>
        <div className="landing-preview__panel">
          <span className="landing-preview__label">Spend by category</span>
          {PREVIEW_BARS.map((bar) => (
            <div key={bar.name} className="landing-preview__row">
              <span>{bar.name}</span>
              <span className="landing-preview__track">
                <span style={{ width: `${bar.width}%`, background: bar.color }} />
              </span>
            </div>
          ))}
        </div>
        <div className="landing-preview__panel">
          <span className="landing-preview__label">Upcoming renewals</span>
          <div className="landing-preview__item">
            <span>Website hosting</span>
            <span className="landing-preview__soon">in 2 days</span>
          </div>
          <div className="landing-preview__item">
            <span>Design tools</span>
            <span className="landing-preview__warn">overdue</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing__nav">
        <span className="auth__brand">
          <span className="auth__logo" aria-hidden="true">◆</span>
          Smart Services
        </span>
        <nav className="landing__nav-actions" aria-label="Account">
          <Link className="btn btn--ghost" to="/login">
            Sign in
          </Link>
          <Link className="btn btn--primary" to="/register">
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="landing__hero" aria-labelledby="landing-title">
          <div className="landing__hero-text">
            <p className="landing__eyebrow">Subscription &amp; service tracker</p>
            <h1 id="landing-title" className="landing__title">
              Know what you pay for, before it renews.
            </h1>
            <p className="landing__lead">
              Smart Services keeps all your subscriptions and recurring services
              in one place, with your monthly spend, a breakdown by category and
              reminders before anything renews.
            </p>
            <div className="landing__cta">
              <Link className="btn btn--primary landing__btn-lg" to="/register">
                Create a free account
              </Link>
              <Link className="btn btn--ghost landing__btn-lg" to="/login">
                Sign in
              </Link>
            </div>
          </div>
          <DashboardPreview />
        </section>

        <section className="landing__section" aria-labelledby="features-title">
          <h2 id="features-title" className="landing__h2">
            Everything you need to stay on top of your spending
          </h2>
          <ul className="landing__features">
            {FEATURES.map((f) => (
              <li key={f.title} className="landing__feature">
                <span className="landing__feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing__section" aria-labelledby="steps-title">
          <h2 id="steps-title" className="landing__h2">Get started in three steps</h2>
          <ol className="landing__steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="landing__step">
                <span className="landing__step-num" aria-hidden="true">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing__band" aria-labelledby="band-title">
          <h2 id="band-title">Ready to take control of your subscriptions?</h2>
          <Link className="btn btn--primary landing__btn-lg" to="/register">
            Create a free account
          </Link>
        </section>
      </main>

      <footer className="landing__footer">
        © {new Date().getFullYear()} Smart Services
      </footer>
    </div>
  );
}
