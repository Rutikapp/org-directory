# Organisation Directory

An Angular 18 standalone application for reviewing and creating organisation records. It uses strict TypeScript, signals, built-in template control flow, `inject()` dependency injection, typed non-nullable reactive forms, and the Angular CLI Karma/Jasmine test runner.

## Run locally

From this directory:

- `npm install` installs dependencies.
- `npm start` starts the development server.
- `npm run build` creates a production build.
- `npm test` runs the browser tests once.

The fixture service uses an in-memory local fixture expanded to 140 records, with a 400–900 ms delay, an approximately 15% random list failure rate, and a five-request-per-minute throttle. A retry is provided for failed loads. No backend is required.

## Features

- Directory table with name, status label and dot, member count, owner, and created date.
- Debounced name search and status filter reflected in query parameters; sortable name/date and direction.
- Server-shaped 25-record pages, matching the API's request limit.
- Create form with blur-time field validation and case-insensitive uniqueness checks.
- Distinct loading, error, and empty states.
- English UI strings centralized in `src/app/i18n/en.json` and design tokens centralized in `src/styles.css`.

See `DECISIONS.md` for assessment trade-offs and AI-tool disclosure.
