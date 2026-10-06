/**
 * MCU & DC Tracker - About & TMDB Attribution Page (#/about)
 * Complies strictly with TMDB API terms of use:
 * - Exact required text: "This product uses the TMDB API but is not endorsed or certified by TMDB."
 * - Unmodified TMDB vector logo (assets/tmdb-logo.svg)
 * - TMDB logo styled to be less prominent than site branding
 */

import { escapeHtml } from './card.js';

/**
 * Render About page
 * @param {HTMLElement} container - Main app container
 */
export function renderAboutPage(container) {
  const html = `
    <div class="page-about">
      <!-- Hero / Header -->
      <section class="about-hero" aria-labelledby="about-title">
        <div class="about-hero-inner">
          <span class="hero-badge">PROJECT INFO & ATTRIBUTION</span>
          <h1 id="about-title" class="page-title">About Multiverse Tracker</h1>
          <p class="page-subtitle">
            A comprehensive, client-side checklist and watch-order companion for Marvel and DC films and series.
          </p>
        </div>
      </section>

      <!-- TMDB Attribution Section (Required by TMDB API Terms) -->
      <section class="section-container about-section-tmdb" aria-labelledby="tmdb-attr-title">
        <div class="tmdb-attribution-card">
          <div class="tmdb-card-header">
            <div class="tmdb-logo-wrapper">
              <img
                src="./assets/tmdb-logo.svg"
                alt="The Movie Database (TMDB)"
                class="tmdb-logo-img"
                width="154"
                height="20"
                loading="eager"
              />
            </div>
            <span class="badge badge-platform">Metadata Partner</span>
          </div>

          <div class="tmdb-card-body">
            <h2 id="tmdb-attr-title" class="tmdb-attr-heading">The Movie Database (TMDB) Attribution</h2>
            <blockquote class="tmdb-required-statement">
              "This product uses the TMDB API but is not endorsed or certified by TMDB."
            </blockquote>
            <p class="tmdb-attr-description">
              Movie and television series artwork, high-resolution posters, and initial air dates in this application
              are retrieved via the TMDB API. TMDB API keys and authentication tokens are strictly kept in offline build
              workflows (<code>scripts/fetch-posters.mjs</code>) and are never embedded, transmitted, or accessible in
              client-side browser code.
            </p>
            <div class="tmdb-card-footer">
              <a
                href="https://www.themoviedb.org"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-secondary btn-sm tmdb-external-link"
              >
                Visit The Movie Database (themoviedb.org) &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Project Architecture & Principles -->
      <section class="section-container about-section-architecture" aria-labelledby="arch-title">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-kicker">ENGINEERING DESIGN</span>
            <h2 id="arch-title" class="section-title">Static Architecture & Privacy</h2>
            <p class="section-desc">How Multiverse Tracker was built to be fast, dependable, and completely offline-friendly.</p>
          </div>
        </div>

        <div class="about-grid">
          <div class="about-card">
            <div class="about-card-icon">⚡</div>
            <h3 class="about-card-title">Zero Backend & Offline First</h3>
            <p class="about-card-text">
              Hosted entirely on GitHub Pages as static HTML5, vanilla CSS, and ES Modules. There are no web servers,
              no relational databases, and no runtime third-party analytics trackers.
            </p>
          </div>

          <div class="about-card">
            <div class="about-card-icon">🔒</div>
            <h3 class="about-card-title">100% Client-Side Privacy</h3>
            <p class="about-card-text">
              Your watched status, custom watch plans, and profile settings live strictly in your browser's
              <code>localStorage</code>. No personal data ever leaves your device. You can export or import backups at any time.
            </p>
          </div>

          <div class="about-card">
            <div class="about-card-icon">🎬</div>
            <h3 class="about-card-title">199 Curated Sagas</h3>
            <p class="about-card-text">
              From the MCU and Sony Spider-Man universe to Fox X-Men, DCEU, DCU, Elseworlds, and the Arrowverse. Every entry
              is cataloged with release timelines, chronological order, streaming platform, and Doomsday priority.
            </p>
          </div>
        </div>
      </section>

      <!-- Legal Fan Disclaimer -->
      <section class="section-container about-section-disclaimer" aria-labelledby="disclaimer-title">
        <div class="disclaimer-callout">
          <h3 id="disclaimer-title" class="disclaimer-title">Fan Project Legal Disclaimer</h3>
          <p class="disclaimer-text">
            Multiverse Tracker is an unofficial non-commercial fan project created for organizational and entertainment
            purposes. Marvel, Marvel Cinematic Universe, The Avengers, and related characters are trademarks and copyrights
            of Marvel Studios / The Walt Disney Company. DC, Batman, Superman, Justice League, and related characters are
            trademarks and copyrights of DC Comics / Warner Bros. Discovery. All rights belong to their respective owners.
          </p>
        </div>
      </section>
    </div>
  `;

  container.innerHTML = html;
}

