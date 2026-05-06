# Stuttering

A lightweight VSCode extension that replaces repeated characters with customizable sequences while typing. For example, `((` can be replaced with `{`, and `(((` with `[`.

## Features

- **Real-time replacement**: Automatically replaces repeated characters as you type
- **Fully customizable**: Define your own replacement rules in VSCode settings
- **Lightweight**: Minimal performance impact

## Example

![Demo](media/demo.gif)

This example uses the following mapping configuration:

```json
"stuttering.mappings": {
  "/": [
    {
      "languages": ["verilog", "systemverilog"],
      "mappings": [
        "// ",
        "////////////////////////////////////////////////////////////////////////////////",
        "////////////////////////////////////////////////////////////////////////////////\n// $\n////////////////////////////////////////////////////////////////////////////////"
      ]
    }
  ],
  "&": [
    {
      "languages": ["verilog", "systemverilog"],
      "mappings": [" & ", " && "]
    }
  ],
  "(": [
    {
      "languages": ["verilog", "systemverilog"],
      "mappings": ["[", "{"]
    }
  ],
  ",": [
    {
      "languages": ["verilog", "systemverilog"],
      "mappings": [" <= "]
    }
  ]
}
```

> **Note**: All replacements are configurable via settings.

> **Cursor Positioning**: The `positionMarkerCharacter` (`$` by default) is used to specify the final cursor position after replacement.
> - In the example above, `////////////////////////////////////////////////////////////////////////////////\n// $\n////////////////////////////////////////////////////////////////////////////////` will place the cursor after the `// $` line.
> - If you want to include the `positionMarkerCharacter` itself in the output (without moving the cursor), escape it with a backslash (`\$`).

## Commands

The extension provides the following commands:

- **Toggle Stuttering**: `stuttering.toggle` - Toggles the extension on/off
- **Enable Stuttering**: `stuttering.enable` - Explicitly enables the extension
- **Disable Stuttering**: `stuttering.disable` - Explicitly disables the extension
- **Paste Without Stuttering**: `stuttering.pasteWithoutStuttering` - Pastes content without applying stuttering transformations
- **Temporarily Disable Stuttering**: `stuttering.disableTemporarily` - Disables stuttering until the next non-empty change

You can run these commands from the Command Palette (Ctrl+Shift+P or Cmd+Shift+P) or bind them to keyboard shortcuts in your keybindings.json file.

**Recommended Keybindings:**

### 1. Paste Without Stuttering
To paste without stuttering using the standard paste shortcut (Ctrl+V/Cmd+V), add this to your keybindings.json:

```json
{
  "key": "ctrl+v",
  "command": "stuttering.pasteWithoutStuttering",
  "when": "editorTextFocus"
}
```

Or for macOS:

```json
{
  "key": "cmd+v",
  "command": "stuttering.pasteWithoutStuttering",
  "when": "editorTextFocus"
}
```

### 2. Temporarily Disable Stuttering
To temporarily disable stuttering (useful for middle-click paste on Linux), add this to your keybindings.json:

```json
{
  "key": "alt+s",
  "command": "stuttering.disableTemporarily",
  "when": "editorTextFocus"
}
```

This keybinding allows you to quickly disable stuttering before making a change (like pasting with middle-click), and it will automatically re-enable after your change.

> **Note**: These keybindings only override the default behavior when the stuttering extension is active.

## Extension Settings

This extension contributes the following settings:

### Status Bar Customization
Customize the appearance of the status bar indicator:

- Show/hide the status bar item
- Toggle the checkmark/X icon
- Set different text for enabled/disabled states
- Customize background and foreground colors

## Status Bar Settings

### `stuttering.statusBar.show`
Show or hide the status bar indicator:
```json
"stuttering.statusBar.show": true
```
- Default: `true`

### `stuttering.statusBar.icon`
Show or hide the checkmark/X icon:
```json
"stuttering.statusBar.icon": true
```
- Default: `true`

### `stuttering.statusBar.enabledText`
Text to display when the extension is enabled:
```json
"stuttering.statusBar.enabledText": "Stuttering"
```
- Default: `"Stuttering"`

### `stuttering.statusBar.disabledText`
Text to display when the extension is disabled:
```json
"stuttering.statusBar.disabledText": "Stuttering"
```
- Default: `"Stuttering"`

### `stuttering.statusBar.enabled.background`
Background color when enabled (default, prominent, error, or warning):
```json
"stuttering.statusBar.enabled.background": "default"
```
- Default: `"default"`

### `stuttering.statusBar.enabled.foreground`
Foreground color when enabled (default, prominent, error, warning, or custom):
```json
"stuttering.statusBar.enabled.foreground": "default"
```
- Default: `"default"`

For custom foreground color, use:
```json
"stuttering.statusBar.enabled.customForeground": "#FF0000"
```

### `stuttering.statusBar.disabled.background`
Background color when disabled (default, prominent, error, or warning):
```json
"stuttering.statusBar.disabled.background": "default"
```
- Default: `"default"`

### `stuttering.statusBar.disabled.foreground`
Foreground color when disabled (default, prominent, error, warning, or custom):
```json
"stuttering.statusBar.disabled.foreground": "default"
```
- Default: `"default"`

For custom foreground color, use:
```json
"stuttering.statusBar.disabled.customForeground": "#FF0000"
```

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

Each mapping entry can specify:
- `languages`: Array of language IDs where this mapping applies
- `mappings`: Array of replacement sequences for repeated characters
- `replace` (optional): Single character replacement for a single occurrence

The `replace` key is useful when you want to replace even a single occurrence of a character with something else. For example, in TCL where `{` is dominant, you can configure it so that hitting `(` once will insert `{` instead:

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
      "replace": "{"  // Single ( will be replaced by {
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

### `stuttering.positionMarker`
Enable/disable the position marker for cursor placement after replacement:
```json
"stuttering.positionMarker": true
```
- Default: `true`

### `stuttering.positionMarkerCharacter`
The character used to mark cursor position after replacement:
```json
"stuttering.positionMarkerCharacter": ""
```
- Default: `""`

### `stuttering.processMultiLine`
Enable/disable multi-line processing:
```json
"stuttering.processMultiLine": false
```
- Default: `false`
- When enabled, stuttering replacement will be performed on complete lines or multi-line selections