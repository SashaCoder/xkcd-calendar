# Proposal

## Why

XKCD comics are currently consumed as a feed, which makes it difficult to browse comics by the dates they were published. A monthly calendar provides a familiar way to explore a comic archive and quickly open a full comic.

## What Changes

- Add a single-page application that displays XKCD comics in a month-by-month calendar.
- Let readers move between months and choose a year.
- Show a comic preview on its publication date and expand that day to show the full comic when selected.
- Use the XKCD feed to discover the latest comic and the comic archive to fill historical dates needed for the selected month.
- Provide clear loading, empty-day, and error states while comics are retrieved.

## Capabilities

### New Capabilities
- `xkcd-calendar`: Browse comics by publication date in a navigable month and year calendar, including preview and full-comic views.

### Modified Capabilities
- None.

## Impact

This is a greenfield web application in the current workspace. It will need a client-side calendar UI and a data access layer for the XKCD feed and comic archive. The archive's availability, request limits, and browser cross-origin access may affect whether requests can be made directly from the browser or need a small server-side proxy.
