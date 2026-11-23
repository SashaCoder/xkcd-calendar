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
- Reduce the preview image's maximum height and constrain its width within its day cell. Retain responsive overrides for narrow layouts so previews do not dominate either the grid or list view.
- Keep the expanded image responsive to the viewport, with internal scrolling available when comic details exceed the available height.

## Risks / Trade-offs

- A centered overlay obscures part of the calendar while open → provide a clear dismiss control and preserve the calendar state behind the backdrop.
- Smaller previews may make comic art harder to inspect → the expanded view continues to show the full image at a larger responsive size.

## Migration Plan

No data or API migration is needed. Rollback consists of restoring inline expansion and the prior preview sizing styles.
