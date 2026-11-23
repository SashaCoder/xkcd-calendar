# Spec Delta

## Purpose

This capability lets readers browse XKCD comics by publication month and year, preview comics on their publication dates, and expand a selected comic for full viewing.

## ADDED Requirements

### Requirement: Display comics in a monthly calendar
The application SHALL display a calendar grid for the selected month and year, placing each comic on its publication date and leaving dates without a comic visibly empty.

#### Scenario: Open the current month
- **WHEN** a reader opens the application
- **THEN** the calendar shows the current month and year with available comics on their publication dates

#### Scenario: Month has dates without comics
- **WHEN** a selected month contains dates without a published comic
- **THEN** each date remains in the calendar with no comic preview, text, or placeholder

### Requirement: Navigate months and select a year
The application SHALL let readers move to the previous or next month and select a year between the earliest available comic year and the current year, updating the calendar to the selected month and year. It SHALL NOT offer navigation to a future month.

#### Scenario: Move to an adjacent month
- **WHEN** a reader activates previous-month or next-month navigation
- **THEN** the calendar displays the adjacent month, updating the year when navigation crosses a year boundary

#### Scenario: Select a year
- **WHEN** a reader selects a year and month
- **THEN** the calendar displays comics published in that month and year

#### Scenario: Reach the current month boundary
- **WHEN** the selected month is the current month
- **THEN** next-month navigation is unavailable and no future year is selectable

### Requirement: Preview and expand a comic
The application SHALL show a selectable preview for the first comic on each publication date and allow the reader to expand that date to view the full comic image, title, and alt text. When multiple comics share a date, the application SHALL show the comic with the lowest comic number and include links to the other comics in its description.

#### Scenario: Expand a comic preview
- **WHEN** a reader selects a comic preview
- **THEN** that date displays the full comic image with its title and alt text

#### Scenario: Collapse an expanded comic
- **WHEN** a reader activates the expanded comic control again
- **THEN** the date returns to its preview state

#### Scenario: Multiple comics share a publication date
- **WHEN** more than one comic has the same publication date
- **THEN** the comic with the lowest comic number is shown, and its description includes links to the other comics' XKCD pages

### Requirement: Load comics from XKCD sources
The application SHALL use the XKCD RSS feed to discover the latest comic and XKCD comic metadata to find comics for the selected month, including months older than the feed's retained entries.

#### Scenario: Browse an older month
- **WHEN** a reader selects a month whose comics are absent from the current feed entries
- **THEN** the application retrieves the relevant archived comic metadata and places each comic on its publication date

#### Scenario: Comic source is unavailable
- **WHEN** comic data cannot be retrieved
- **THEN** the application shows a clear error and lets the reader retry without presenting the failed load as an empty month

### Requirement: Support calendar interaction accessibly
The application SHALL expose month and year selection, comic selection, and comic expansion to keyboard and assistive-technology users with meaningful labels and visible focus.

#### Scenario: Navigate and expand with a keyboard
- **WHEN** a reader uses keyboard controls to reach and activate a comic preview
- **THEN** the comic expands and focus remains on or moves predictably to the expanded comic control
