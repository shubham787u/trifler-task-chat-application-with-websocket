import { ArrowLeft, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import "../styles/not-found.css";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-shell">
        <header className="not-found-topbar">
          <Link className="not-found-back" to="/login">
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
          <Link className="not-found-wordmark" to="/login" aria-label="Trifler home">
            <span><MessageCircle size={17} /></span>
            trifler<span className="not-found-period">.</span>
          </Link>
        </header>

        <section className="not-found-card" aria-labelledby="not-found-title">
          <div className="not-found-visual" aria-hidden="true">
            <span className="not-found-orbit not-found-orbit-one" />
            <span className="not-found-orbit not-found-orbit-two" />
            <span className="not-found-number">404</span>
            <span className="not-found-bubble"><MessageCircle size={25} /></span>
          </div>
          <div className="not-found-content">
            <span className="not-found-kicker">A LITTLE OFF THE MAP</span>
            <h1 id="not-found-title">This page wandered off.</h1>
            <Link className="not-found-home-button" to="/login">
              <ArrowLeft size={16} />
              Back to Trifler
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
