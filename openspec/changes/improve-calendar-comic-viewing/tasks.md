# Tasks

## 1. Compact Calendar Previews

- [ ] 1.1 Reduce comic preview image dimensions in `src/styles.css` for desktop and narrow layouts; verify a month remains easy to scan in a small browser window.
- [ ] 1.2 Update or add UI coverage for preview sizing behavior where the existing test setup supports it; verify the preview remains selectable and its accessible label is preserved.

## 2. Centered Expanded Comic View

- [ ] 2.1 Move expanded comic details into a centered viewport overlay in `src/App.tsx` and style a viewport-bounded, scrollable container in `src/styles.css`; verify title, full image, alt text, and links to other same-date comic images are available.
- [ ] 2.2 Make each shared-date image link switch the image and corresponding title and alt text in the existing overlay; verify the overlay remains open and displays the selected comic.
- [ ] 2.3 Add accessible dismissal and synchronize close behavior with the preview's expanded state; verify mouse and keyboard users can open and close the view and the calendar state remains intact.
- [ ] 2.4 Update UI interaction coverage for overlay placement, close behavior, loading failure, and shared-date image switching; verify the selected comic is shown with its matching title and alt text.
