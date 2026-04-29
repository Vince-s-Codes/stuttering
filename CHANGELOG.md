# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
