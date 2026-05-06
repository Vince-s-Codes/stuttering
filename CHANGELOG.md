# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Status Bar Customization:**
  - Added comprehensive status bar customization options
  - Show/hide status bar indicator
  - Toggle checkmark/X icon display
  - Set different text for enabled/disabled states
  - Customize background colors using theme colors (default, prominent, error, warning)
  - Customize foreground colors using theme colors or custom hex colors

- **Debugging Support:**
  - Added `stuttering.logLevel` configuration option with levels: none, error, warning, note, debug
  - Implemented logging functionality with debug, note, warning, and error levels
  - Added logging infrastructure similar to auto-wrap extension

### Fixed
- **Position Marker Bug:** Fixed issue where `$` characters were being incorrectly removed from user-entered code. The extension now preserves `$` characters in your code while still supporting cursor positioning in generated replacements.

## [1.0.0] - 2026-04-29

### Added
- **Core Features:**
  - Detects and replaces double or triple characters with configurable mappings.
  - Escape character functionality to prevent replacements when needed.
  - Position marker for cursor placement after replacement.

- **Configuration Options:**
  - `stuttering.escape`: Toggle escape character functionality.
  - `stuttering.escapeCharacter`: Set the escape character.
  - `stuttering.mappings`: Define character mappings.
  - `stuttering.smartClose`: Automatically close brackets/parentheses when appropriate.
  - `stuttering.positionMarker`: Toggle position marker functionality.
  - `stuttering.positionMarkerCharacter`: Set the position marker character.
  - `stuttering.processMultiLine`: New option to enable/disable stuttering replacement on complete lines or multi-line selections.

- **Commands:**
  - Toggle, enable, disable, paste without stuttering, and temporarily disable.

- **UI/UX:**
  - Status bar indicator showing extension activation status.
