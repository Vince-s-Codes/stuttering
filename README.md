# Stuttering - VSCode Extension

A lightweight VSCode extension that replaces repeated characters with customizable sequences while typing. For example, `((` can be replaced with `{`, and `(((` with `[`.

## Features

- **Real-time replacement**: Automatically replaces repeated characters as you type
- **Fully customizable**: Define your own replacement rules in VSCode settings
- **Lightweight**: Minimal performance impact

### Example Replacements

| Input | Output (Default) |
|-------|------------------|
| `((` | `{`              |
| `(((`| `[`              |
| `))` | `}`              |
| `)))`| `]`              |

> **Note**: All replacements are configurable via settings.

## Requirements

- Visual Studio Code (v1.75.0 or higher)

## Extension Settings

This extension contributes the following settings:

- `stuttering.escape`: Enable/disable the escape character (default: `true`)
- `stuttering.escapeCharacter`: The escape character to prevent stuttering (default: `'`)
- `stuttering.mappings`: Define mappings for character replacements (language-specific or default)
- `stuttering.smartClose`: Automatically use the appropriate closing character (default: `true`)

### Example Configuration in `settings.json`

```json
"stuttering.mappings": {
  "(": [
    {
      "languages": ["verilog", "systemverilog"],
      "mappings": ["[", "{"]
    },
    {
      "languages": ["tcl"],
      "mappings": ["[", "("],
      "replace": "{"
    },
    {
      "languages": ["default"],
      "mappings": ["{", "["]
    }
  ]
}
```

## Release Notes

### 1.0.0

- Initial release
  - Added support for customizable character replacements
  - Real-time replacement while typing
  - Configurable via VSCode settings