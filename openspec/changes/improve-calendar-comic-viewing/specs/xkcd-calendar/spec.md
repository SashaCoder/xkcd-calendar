# Spec Delta

## MODIFIED Requirements

### Requirement: Preview and expand a comic
The application SHALL show a compact selectable preview for the first comic on each publication date and allow the reader to expand that date to view the full comic image, title, and alt text in a centered overlay container above the calendar. When multiple comics share a date, the application SHALL show the comic with the lowest comic number and include links to the other comics in its description.

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
- **THEN** the comic with the lowest comic number is shown, and its description includes links to the other comics' image and displays it on the centered overlay container display
