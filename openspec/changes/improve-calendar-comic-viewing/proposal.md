# Proposal

## Why

The monthly calendar is difficult to scan in a small browser window because comic previews occupy too much of each day cell. Expanding a comic inline also competes with the calendar layout instead of giving the reader a clear, focused view.

## What Changes

- Reduce the size of comic preview images so more of the month remains visible in compact windows.
- Show an expanded comic in a centered overlay container, keeping the calendar behind it.
- Center the expanded comic image within its own area in the overlay.
- Keep the expanded overlay from scrolling and size the image area so the comic's alt text remains visible underneath it across image aspect ratios.
- Show links to additional comics from the same date in a separate list box to the right of the image on wider screens.
- Keep the selected comic in that list and identify it as selected.
- Preserve comic title and image alt text, and let readers open another same-date comic's image from the list without closing the overlay.
- Keep comic selection and overlay dismissal accessible.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `xkcd-calendar`: Specify compact comic previews and a centered expanded comic view.

## Impact

The calendar presentation and comic expansion behavior in `src/App.tsx` and `src/styles.css` will change. No API or dependency changes are expected.
