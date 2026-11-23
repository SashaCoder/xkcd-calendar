# Tasks

## 1. Compact Calendar Previews

- [x] 1.1 Reduce comic preview image dimensions in `src/styles.css` for desktop and narrow layouts; verify a month remains easy to scan in a small browser window.
- [x] 1.2 Update or add UI coverage for preview sizing behavior where the existing test setup supports it; verify the preview remains selectable and its accessible label is preserved.

## 2. Centered Expanded Comic View

- [x] 2.1 Move expanded comic details into a centered viewport overlay in `src/App.tsx` and style a viewport-bounded, scrollable container in `src/styles.css`; verify title, full image, alt text, and links to other same-date comic images are available.
- [x] 2.2 Make each shared-date image link switch the image and corresponding title and alt text in the existing overlay; verify the overlay remains open and displays the selected comic.
- [x] 2.3 Add accessible dismissal and synchronize close behavior with the preview's expanded state; verify mouse and keyboard users can open and close the view and the calendar state remains intact.
- [x] 2.4 Update UI interaction coverage for overlay placement, close behavior, loading failure, and shared-date image switching; verify the selected comic is shown with its matching title and alt text.

## 3. Centered Image and Shared-Date List

- [x] 3.1 Center the expanded comic image in its own content area and place shared-date alternatives in a separate list box to its right on wider viewports; stack the list below the image on narrow screens.
- [x] 3.2 Add or update UI coverage for the separate list box, image centering container, shared-date switching, and responsive layout hooks; verify existing dismissal and image-failure behavior remains available.

## 4. Keep the Expanded Comic and Selection Visible

- [x] 4.1 Keep every same-date comic in the alternatives list, mark the selected comic, and size the non-scrolling overlay so the comic image scales above its always-visible alt text across aspect ratios.
- [x] 4.2 Update UI coverage to verify the selected comic remains in the list and the image description remains present while existing image switching, failure, and dismissal behavior continues to work.
