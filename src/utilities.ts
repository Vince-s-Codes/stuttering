// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import {
  getCachedLanguageMappings,
  cacheLanguageMappings,
  getCachedReplacements,
  cacheReplacements
} from './cache';

/**
 * Gets the indentation of a line in the document
 *
 * @param document The text document
 * @param offset The offset position in the document
 * @returns The indentation string (spaces or tabs) at the beginning of the line
 */
export function getIndent(document: vscode.TextDocument, offset: number): string {
  const position = document.positionAt(offset);
  const line = document.lineAt(position.line);

  // Find the first non-whitespace character
  const firstNonWs = line.firstNonWhitespaceCharacterIndex;

  // Return the indentation (whitespace before the first non-whitespace character)
  return line.text.substring(0, firstNonWs >= 0 ? firstNonWs : line.text.length);
}

/**
 * Fixes indentation for multi-line replacements
 *
 * If the replacement text contains newlines, this function ensures each line
 * is properly indented according to the provided indentation string.
 *
 * @param replacement The replacement text to fix
 * @param indent The indentation string to use for each line
 * @returns The replacement text with proper indentation
 */
export function fixReplacement(replacement: string, indent: string): string {
  // If the replacement doesn't contain newlines, return it as-is
  if (!replacement.includes('\n')) {
    return replacement;
  }

  // Split the replacement into lines and indent each line (except the first)
  const lines = replacement.split('\n');
  if (lines.length > 1) {
    // Indent all lines after the first one
    for (let i = 1; i < lines.length; i++) {
      lines[i] = indent + lines[i];
    }
    return lines.join('\n');
  }

  return replacement;
}

/**
 * Interface for mapping configuration
 */
interface MappingConfig {
  languages: string[];
  mappings: string[];
  replace: string;
}

/**
 * Gets the appropriate mappings for the current language from the configuration.
 *
 * @param mappings The complete mappings configuration
 * @param languageId The language ID of the current document
 * @returns An object containing:
 *          - matchingMappings: The mappings that match the current language
 *          - maxPreviousLength: The maximum length of previous text to check for replacements
 */
export function getLanguageMappings(
  mappings: Record<string, MappingConfig[]>,
  languageId: string
): {matchingMappings: Record<string, MappingConfig>, maxPreviousLength: number} {
  // Check if we have cached mappings for this language
  const cached = getCachedLanguageMappings(languageId);
  if (cached) {
    return cached;
  }

  const matchingMappings: Record<string, MappingConfig> = {};
  let maxPreviousLength = 0;

  // Process each key in the mappings
  for (const [key, sequences] of Object.entries(mappings)) {
    const sequence = getSequence(sequences, languageId);

    if (sequence) {
      matchingMappings[key] = sequence;

      // Generate replacements to find the maximum previous length
      const replacements = getReplacements(key, sequence, languageId);

      // Find the maximum previous length for this key
      for (const replacement of replacements) {
        if (replacement.previous.length > maxPreviousLength) {
          maxPreviousLength = replacement.previous.length;
        }
      }
    }
  }

  // Cache the results for future use
  cacheLanguageMappings(languageId, matchingMappings, maxPreviousLength);

  return { matchingMappings, maxPreviousLength };
}

/**
 * Returns the closing character based on the last unclosed opening character.
 * @param editor The active text editor.
 * @param offset The position from which to start parsing backwards.
 * @returns The closing character (either ')', ']', or '}') or null if no unclosed opening character is found.
 */
export function getClosingCharacter(editor: vscode.TextEditor, offset: number): string | null {
  const document = editor.document;
  const text = document.getText(new vscode.Range(document.positionAt(0), document.positionAt(offset)));
  const stack: string[] = [];
  const openingChars = ['(', '[', '{'];
  const closingChars = { ')': '(', ']': '[', '}': '{' };

  for(let i = text.length - 1; i >= 0; i--) {
    const char = text[i];

    if(Object.keys(closingChars).includes(char)) {
      stack.push(closingChars[char as keyof typeof closingChars]);
    } else if(openingChars.includes(char)) {
      if(stack.length === 0) {
        return Object.keys(closingChars).find(key => closingChars[key as keyof typeof closingChars] === char) ?? null;
      }
      if(stack.pop() !== char) {
        return null;
      }
    }
  }
  return null;
}

/**
 * Generates an array of replacement objects based on a key and its sequence of replacements.
 *
 * @param key The initial key character that triggers the replacements
 * @param sequence Object containing the sequence of replacements for the key, or null
 * @param languageId The language ID for cache key generation
 * @returns An array of objects, each containing:
 *          - previous: The string to be replaced (initially the key, then each subsequent replacement)
 *          - replacement: The string that should replace the previous string
 */
export function getReplacements(key: string, sequence: MappingConfig|null, languageId: string) {
  // Create a cache key based on key and languageId
  const cacheKey = `${languageId}:${key}`;

  // Check if we have cached replacements
  const cached = getCachedReplacements(cacheKey);
  if (cached) {
    return cached;
  }

  const result: {previous: string, replacement: string}[] = [];
  let previous = key;

  if(sequence !== null) {
    sequence.mappings.forEach((k) => {
      result.unshift({previous: previous, replacement: k});
      previous = k;
    });
    if(sequence.replace) {
      result[result.length - 1].previous = sequence.replace;
    }
  }

  // Cache the result for future use
  cacheReplacements(cacheKey, result);

  return result;
}

/**
 * Retrieves the appropriate sequence configuration for a given language.
 *
 * @param sequences Array of sequence configurations to search through
 * @param language The language ID to find a matching sequence for
 * @returns The matching sequence configuration for the language, or the default sequence if no match is found,
 *          or null if neither a language-specific nor default sequence exists
 */
export function getSequence(sequences: MappingConfig[], language: string) {
  let index = -1;

  for(let i = 0; i < sequences.length; i++) {
    if(sequences[i].languages.includes(language)) {
      return sequences[i];
    } else if(sequences[i].languages.includes('default')) {
      index = i;
    }
  }
  if(index >= 0) {
    return sequences[index];
  }
  return null;
}

/**
 * Inserts a string at a specific index in a replacement object.
 * Handles position markers if present in the inserted text.
 *
 * @param replacement The replacement object with `replacement` string and `index` number
 * @param toInsert The string to insert
 * @param positionMarker Whether position markers are enabled
 * @param positionMarkerCharacter The character used for position markers
 * @returns The updated replacement object
 */
export function insertAtIndex(
  replacement: {replacement: string, index: number},
  toInsert: string,
  positionMarker: boolean,
  positionMarkerCharacter: string
): {replacement: string, index: number} {
  let position = toInsert.length;
  let text = toInsert;

  if(positionMarker) {
    // Process position markers in the text
    let processedText = '';
    let markerPos = -1;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === positionMarkerCharacter && (i === 0 || text[i - 1] !== '\\')) {
        // Found a position marker not preceded by backslash
        markerPos = i;
      } else if (text[i] === '\\' && i + 1 < text.length && text[i + 1] === positionMarkerCharacter) {
        // Found escaped position marker, skip the backslash
        processedText += text[i + 1];
        i++; // Skip next character
      } else {
        processedText += text[i];
      }
    }
    text = processedText;
    if (markerPos >= 0) {
      position = markerPos;
    } else {
      position = text.length;
    }
  }
  const newReplacement = replacement.replacement.slice(0, replacement.index) + text + replacement.replacement.slice(replacement.index);
  const newIndex = replacement.index + position;

  return {
    replacement: newReplacement,
    index: newIndex
  };
}

/**
 * Removes characters from a replacement object at the current index.
 *
 * @param replacement The replacement object with `replacement` string and `index` number
 * @param count The number of characters to remove
 * @returns The updated replacement object
 */
export function removeAtIndex(replacement: {replacement: string, index: number}, count: number): {replacement: string, index: number} {
  const start = replacement.index - count;
  const newReplacement = replacement.replacement.slice(0, start) + replacement.replacement.slice(replacement.index);
  return {
    replacement: newReplacement,
    index: start
  };
}