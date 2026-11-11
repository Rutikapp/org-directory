# Decisions

- **Conflict 1 — pagination:** Chose 25-record pages to respect the API's hard maximum and avoid 6+ requests under the five-per-minute limit. Rejected loading all 137+ records for a single view despite the ops preference; paging is explicit and the current result count is shown. This mock service enforces the request cap and applies paging locally.
- **Conflict 2 — status accessibility:** Chose a visible text label plus a colored dot and color treatment. Rejected the dot-only design so status is never conveyed by color alone.
- **Messy fixture:** Kept the eight supplied seed objects as raw values, including duplicate IDs, blank/null names, inconsistent status casing/typo, string and negative counts, invalid email, and mixed/invalid dates. The UI adapter creates stable per-row keys, normalizes known statuses case-insensitively, maps invalid status to “Unknown”, sanitizes counts/dates, and keeps malformed rows visible.
- **Mock API:** Expanded the source fixture to exactly 140 records. Simulated 400–900 ms request latency, a ~15% random list failure, and a five-requests-per-minute throttle; the UI has a retry state. Filtering, sorting, and page slicing are local to this mock service.
- **URL state:** Uses query parameters `q`, `status`, `sort`, `direction`, and `page`; transient form visibility is not shared.
- **Validation:** Duplicate names are compared case-insensitively against raw fixture names, so valid new names can still be added when existing data is malformed. Errors appear after blur and on submit.
- **Tests:** Included the Angular CLI Karma/Jasmine runner and focused tests for fixture normalization, refreshed filtered/sorted results after creation, and standalone component creation.
- **AI-tool declaration:** GitHub Copilot was used to scaffold and implement this project. The candidate should review and be prepared to explain every implementation decision and line before submission.
- **With two more days:** Add a separate API adapter contract test suite and accessibility/browser tests, then verify pagination/rate-limit behavior against a realistic remote mock rather than in-memory slicing.
