# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-28

### Added

- **Core Features:**
  - Detects and replaces double or triple characters with configurable mappings.
  - Supports language-specific mappings for different programming languages.
  - Escape character functionality to prevent replacements when needed.

- **Configuration Options:**
  - `stuttering.escape`: Toggle escape character functionality.
  - `stuttering.escapeCharacter`: Set the escape character.
  - `stuttering.mappings`: Define character mappings for different languages.
  - `stuttering.smartClose`: Automatically close brackets/parentheses when appropriate.

- **UI/UX:**
  - Status bar indicator showing extension activation status.
  - Toggle command to enable/disable the extension.
