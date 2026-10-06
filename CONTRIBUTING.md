# Contributing

## Data Corrections
The single source of truth for all titles is `data/catalog.csv`.
To add or fix a title:
1. Edit `data/catalog.csv`.
2. Run `node scripts/csv-to-data.mjs`
3. Run `node scripts/validate-data.mjs`
4. Commit both the `.csv` and the generated `js/data.js`.

If fixing a poster mismatch, add the ID to `data/tmdb-overrides.json` and run the poster fetch script (never commit your TMDB token!).

## Local Development
- Run a local server: `python3 -m http.server`
- Make sure to check `node scripts/test-acceptance.mjs` passes before submitting a PR.
