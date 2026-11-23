# Tasks

## 1. Application foundation

- [x] 1.1 Create the single-page application scaffold and project scripts; verify the production build command completes successfully.

## 2. XKCD archive data

- [x] 2.1 Implement RSS and comic JSON parsing plus a resumable, idempotent archive-index generation/update command that skips XKCD's intentionally unassigned #404; verify tests cover valid records, malformed data, source errors, and resuming an interrupted update.
- [x] 2.2 Add month/year lookup and session caching over the date index; verify tests cover date filtering, preservation and comic-number ordering for duplicate publication dates, leap days, and months with no comics.
- [x] 2.3 Document the data sources, index generation/update commands, and any required proxy configuration; verify the documented setup works from a clean checkout.

## 3. Calendar browsing

- [x] 3.1 Implement the monthly calendar, empty dates, month navigation, and year selection bounded by the available comic years and current month; verify tests cover month lengths, year boundaries, and navigation limits.
- [x] 3.2 Add responsive and keyboard-accessible calendar controls; verify keyboard navigation and visible focus across desktop and narrow-screen layouts.

## 4. Comic preview and expansion

- [x] 4.1 Implement the lowest-numbered comic preview and inline full-comic expansion with title and alt text; for shared dates, include links to the other comic pages in its description, and verify tests cover that behavior, expand/collapse, and image loading errors.
- [x] 4.2 Verify comic controls work with keyboard and assistive-technology labels; document any interaction details that are not apparent in the UI.

## 5. Integration

- [x] 5.1 Connect the calendar to the live feed and generated archive index; verify an older month, the current month, and a failed source request render the expected states.
- [x] 5.2 Verify the production build serves the complete SPA and the selected comic remains readable at narrow viewport widths.
