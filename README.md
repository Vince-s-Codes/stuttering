# Stuttering

A lightweight VSCode extension that replaces repeated characters with customizable sequences while typing. For example, `((` can be replaced with `{`, and `(((` with `[`.

## Features

- **Real-time replacement**: Automatically replaces repeated characters as you type
- **Fully customizable**: Define your own replacement rules in VSCode settings
- **Lightweight**: Minimal performance impact

### Example Replacements

| Input | Output (Default) |
|-------|------------------|
| `((`  | `{`              |
| `(((` | `[`              |
| `))`  | `}`              |
| `)))` | `]`              |

> **Note**: All replacements are configurable via settings.

## Extension Settings

This extension contributes the following settings:

### `stuttering.escape`
Enable/disable the escape character:
```json
"stuttering.escape": true
```
- Default: `true`

### `stuttering.escapeCharacter`
The escape character to prevent stuttering:
```json
"stuttering.escapeCharacter": "'"
```
- Default: `'`

### `stuttering.mappings`
Define mappings for character replacements (language-specific or default):
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

### `stuttering.smartClose`
Automatically use the appropriate closing character:
```json
"stuttering.smartClose": true
```
- Default: `true`