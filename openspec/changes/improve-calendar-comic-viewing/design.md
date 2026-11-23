# Design

## Context

See `proposal.md` for the motivation. The current React calendar renders `.comic-expanded` inside the selected `.day-cell`; its positioning is relative to that cell. Preview images currently allow a 90px height on desktop. The existing media query switches the grid to a list on narrow screens.

## Goals / Non-Goals

**Goals:**
- Keep previews visually subordinate so more calendar dates fit in a compact window.
- Present expanded comic details in a centered overlay that is not constrained by a day cell.
- Keep the selected comic's title and alt text, and let readers switch to another same-date comic from a link in the overlay.

**Non-Goals:**
- Changing calendar data, navigation, or which comic is selected for a shared date.
- Adding a new UI dependency.

## Decisions

- Render the expanded content in a viewport-level overlay layer, centered with a fixed backdrop and a content container sized within the available viewport. This avoids day-cell clipping and lets the overlay occupy the middle of the screen; an inline positioned panel remains tied to the calendar grid.
- Keep the existing preview button as the toggle and expose the overlay's dismiss action with an accessible button. Closing the overlay clears the selected comic so the button's expanded state remains accurate.
- Render links for other comics on the same date inside the overlay. Selecting one updates the active comic details and image in that overlay, including its title and alt text, without dismissing the container.
- Arrange the expanded view as a centered image area beside a visually distinct list box for same-date comics. Center the image within its area; place the list box to its right on wider viewports and below it on narrow viewports to avoid horizontal overflow. Keep every comic in the list, including the active comic, and mark the active link.
- Reduce the preview image's maximum height and constrain its width within its day cell. Retain responsive overrides for narrow layouts so previews do not dominate either the grid or list view.
- Keep the overlay container fixed within the viewport without scrolling. Make its content a bounded flex layout so the comic image scales to the available image area and the alt text remains visible below it for portrait and landscape images. The side-by-side content area and list box must fit within the viewport-bounded overlay.

## Risks / Trade-offs

- A centered overlay obscures part of the calendar while open → provide a clear dismiss control and preserve the calendar state behind the backdrop.
- Smaller previews may make comic art harder to inspect → the expanded view continues to show the full image at a larger responsive size.

## Migration Plan

No data or API migration is needed. Rollback consists of restoring inline expansion and the prior preview sizing styles.
