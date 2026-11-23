# Design

## Context

The workspace contains no application code or established framework. XKCD exposes a feed and a JSON record for the current comic and individual numbered comics. Since comics are not published every day and the feed is not a complete archive, the calendar must distinguish empty dates from missing data and locate archived records by their metadata dates.

## Goals / Non-Goals

**Goals:**
- Keep calendar behavior independent of feed and archive response formats.
- Use a generated date index for historical month lookup, while caching newer records in the session as the feed advances.
- Preserve comic title and alt text when displaying an image.

**Non-Goals:**
- Search, favorites, accounts, or an offline archive of every XKCD comic.
- Reproducing interactive comics beyond the image and metadata provided by XKCD.

## Decisions

- **Use a small typed single-page web app with a dedicated XKCD data module.** Keep date navigation, calendar rendering, and comic expansion in the client. Isolate RSS parsing and numbered JSON retrieval so the UI does not depend on remote payload shapes. The workspace has no existing stack to preserve; a lightweight TypeScript SPA setup is appropriate. A server-side proxy is not part of the initial architecture unless browser cross-origin restrictions make direct requests impossible.
- **Build a compact date index from XKCD comic JSON records and use the feed to discover new comics.** The RSS feed does not cover arbitrary past months, and walking backward from the latest number on every old-month visit would require too many requests. A small data-generation/update script will persist records containing the comic number, publication date, title, image URL, and alt text. The app uses this index for month lookup, then retrieves the RSS feed and missing newer JSON records into a session-only index; it does not write to the generated index at runtime. Use metadata dates, not number-to-date assumptions. Treat missing or malformed records as data errors rather than empty calendar dates, except for the known unassigned number #404.
- **Skip XKCD #404 during index generation.** XKCD intentionally has no comic numbered 404. This known gap is excluded from the generated index; failures or malformed responses for any other comic number remain data errors.
- **Cache retrieved records in memory for the app session.** This avoids repeat feed and JSON requests while navigating without introducing stale persistent state or a storage dependency. Keep the generated index as the source for historical month lookup.
- **Use publication date as the calendar key and display only the lowest-numbered comic for a date.** A calendar day maps directly to a date from comic metadata. If multiple records share a date, show the comic with the lowest comic number in the day cell and place links to the other comics in that comic's description so they remain accessible without crowding the calendar.
- **Expand comics inline in their calendar day.** Keep title, image, and alt text together and let the image scale to the available cell width. On narrow screens, use a stacked calendar layout so the selected comic remains readable.

## Risks / Trade-offs

- [Direct requests may be blocked by browser CORS policy or limited by the source] → Keep all requests behind the data module; if direct access fails, add a same-origin proxy that fetches the feed and JSON records.
- [Generating or updating the index may encounter source failures or request limits] → Make updates resumable and idempotent, retain the last known good index, and report partial or failed refreshes distinctly from an empty month.
- [A fixed seven-column calendar can be cramped on phones] → Provide a narrow-screen stacked presentation while preserving date labels and navigation.

## Migration Plan

No existing application or data is present to migrate. Build and deploy the SPA with any required same-origin data proxy as one release. Rollback consists of reverting that deployment; no stored user data is affected.

## Open Questions

None that change the proposed behavior or architecture. Confirm source request behavior and any proxy need during implementation.
