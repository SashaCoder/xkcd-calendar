# Spec Delta

## MODIFIED Requirements

### Requirement: Preview and expand a comic
The application SHALL show a compact selectable preview for the first comic on each publication date and allow the reader to expand that date to view the full comic image, title, and alt text in a centered overlay container above the calendar. The overlay container SHALL NOT scroll. The full comic image SHALL be centered within its own content area and sized to keep its alt text visible beneath it across image aspect ratios. When multiple comics share a date, the application SHALL show the comic with the lowest comic number and provide a separate list box containing links to all comics from that date, including the currently selected comic. The list box SHALL identify the selected comic, appear to the right of the image on wider screens, and remain available below the image on narrow screens without horizontal overflow.

#### Scenario: Expand a comic preview
- **WHEN** a reader selects a comic preview
- **THEN** a centered overlay container displays the full comic image with its title and alt text while the calendar remains behind it

#### Scenario: Collapse an expanded comic
- **WHEN** a reader activates the expanded comic control again
- **THEN** the overlay closes and the calendar returns to its prior view

#### Scenario: Keep the calendar visible in a compact window
- **WHEN** a reader views the calendar in a small browser window
- **THEN** comic preview images remain small enough to leave more of the monthly calendar visible

#### Scenario: Multiple comics share a publication date
- **WHEN** more than one comic has the same date
- **THEN** the comic with the lowest comic number is shown, its image is centered in its content area, and a separate list box to the right contains links to the other comics

#### Scenario: View shared-date comic links on a narrow screen
- **WHEN** a reader views a comic with shared-date alternatives in a narrow viewport
- **THEN** the separate list box appears below the centered image and remains usable without horizontal overflow

#### Scenario: Keep the selected comic in the shared-date list
- **WHEN** a reader selects any comic from the shared-date list
- **THEN** the list continues to show every comic from that date and identifies the selected comic

#### Scenario: Keep the comic description visible without dialog scrolling
- **WHEN** a reader views an expanded comic with any image aspect ratio
- **THEN** the overlay container does not scroll and the comic's alt text remains visible beneath the image
