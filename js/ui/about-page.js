/**
 * MCU & DC Tracker - About & TMDB Attribution Page (#/about)
 * Flat, comic-book editorial redesign.
 */

export function renderAboutPage(container) {
  const html = `
    <div class="page-about" style="max-width: 1000px; margin: 0 auto; padding-top: 16px; border-top: 4px solid var(--text);">
      <h1 class="display-font" style="font-size: 48px; margin-bottom: 24px;">ABOUT & ATTRIBUTION</h1>

      <section class="section-container" style="margin-bottom: 40px;">
        <div style="border: 2px solid var(--border); background: var(--surface); padding: 24px; display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <img src="./assets/tmdb-logo.svg" alt="The Movie Database (TMDB)" width="154" height="20" loading="eager" />
            <span class="badge">Metadata Partner</span>
          </div>
          <h2 class="display-font" style="font-size: 24px;">The Movie Database (TMDB) Attribution</h2>
          <blockquote style="border-left: 4px solid var(--text); padding-left: 16px; font-style: italic; font-weight: bold;">
            "This product uses the TMDB API but is not endorsed or certified by TMDB."
          </blockquote>
          <p>
            Movie and television series artwork, high-resolution posters, and initial air dates in this application
            are retrieved via the TMDB API. TMDB API keys and authentication tokens are strictly kept in offline build
            workflows and are never embedded, transmitted, or accessible in client-side browser code.
          </p>
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="align-self: flex-start;">
            Visit themoviedb.org
          </a>
        </div>
      </section>

      <section class="section-container" style="margin-bottom: 40px;">
        <h2 class="section-title">ENGINEERING DESIGN</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <div style="border: 2px solid var(--border); padding: 16px; background: var(--surface);">
            <h3 class="display-font" style="font-size: 24px; margin-bottom: 8px;">Zero Backend & Offline First</h3>
            <p>Hosted entirely on GitHub Pages as static HTML5, vanilla CSS, and ES Modules. No web servers, no relational databases, and no runtime analytics trackers.</p>
          </div>
          <div style="border: 2px solid var(--border); padding: 16px; background: var(--surface);">
            <h3 class="display-font" style="font-size: 24px; margin-bottom: 8px;">100% Client-Side Privacy</h3>
            <p>Your watched status, custom watch plans, and profile settings live strictly in your browser's localStorage. No personal data leaves your device.</p>
          </div>
          <div style="border: 2px solid var(--border); padding: 16px; background: var(--surface);">
            <h3 class="display-font" style="font-size: 24px; margin-bottom: 8px;">199 Curated Sagas</h3>
            <p>From the MCU and Sony Spider-Man universe to Fox X-Men, DCEU, DCU, Elseworlds, and the Arrowverse. Every entry cataloged with release, timeline, and platform.</p>
          </div>
        </div>
      </section>

      <section class="section-container" style="margin-bottom: 40px;">
        <div style="background: var(--surface-2); padding: 24px; border: 2px solid var(--border);">
          <h3 class="display-font" style="font-size: 24px; margin-bottom: 8px;">Fan Project Legal Disclaimer</h3>
          <p style="font-size: 14px; color: var(--muted);">
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
