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