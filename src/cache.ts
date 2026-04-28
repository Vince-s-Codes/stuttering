// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';

// Timeout duration in milliseconds (10 seconds)
export const EXTENSION_CHANGE_TIMEOUT = 10000;

// Cache for language mappings to avoid recomputing them
// Structure: {languageId: {matchingMappings, maxPreviousLength}}
const languageMappingsCache = new Map<string, {
  matchingMappings: Record<string, any>,
  maxPreviousLength: number
}>();

// Cache for replacements to avoid recomputing them
// Structure: {cacheKey: {previous: string, replacement: string}[]}
const replacementsCache = new Map<string, {previous: string, replacement: string}[]>();

/**
 * Get cached language mappings
 * @param languageId The language ID to get mappings for
 * @returns Cached mappings or null if not found
 */
export function getCachedLanguageMappings(languageId: string) {
  return languageMappingsCache.get(languageId) || null;
}

/**
 * Cache language mappings
 * @param languageId The language ID to cache mappings for
 * @param matchingMappings The mappings to cache
 * @param maxPreviousLength The maximum previous length to cache
 */
export function cacheLanguageMappings(
  languageId: string,
  matchingMappings: Record<string, any>,
  maxPreviousLength: number
) {
  languageMappingsCache.set(languageId, { matchingMappings, maxPreviousLength });
}

/**
 * Get cached replacements
 * @param cacheKey The cache key to get replacements for
 * @returns Cached replacements or null if not found
 */
export function getCachedReplacements(cacheKey: string) {
  return replacementsCache.get(cacheKey) || null;
}

/**
 * Cache replacements
 * @param cacheKey The cache key to use
 * @param replacements The replacements to cache
 */
export function cacheReplacements(
  cacheKey: string,
  replacements: {previous: string, replacement: string}[]
) {
  replacementsCache.set(cacheKey, replacements);
}

/**
 * Clear all caches
 * Should be called when configuration changes
 */
export function clearAllCaches() {
  languageMappingsCache.clear();
  replacementsCache.clear();
}

// Track changes made by this extension to avoid recursive processing
// Structure: {document: {changes: Map<key, {text: string, timeout: ReturnType<typeof setTimeout>}>, globalTimeout: ReturnType<typeof setTimeout> | null}}
const extensionChanges = new WeakMap<vscode.TextDocument, {
  changes: Map<string, {text: string, timeout: ReturnType<typeof setTimeout>}>
  globalTimeout: ReturnType<typeof setTimeout> | null
}>();

/**
 * Check if a change was made by this extension
 * @param document The document to check for changes
 * @param range The range of the change
 * @param text The text that was changed
 * @returns True if the change was made by this extension, false otherwise
 */
export function isExtensionChange(document: vscode.TextDocument, range: vscode.Range, text: string): boolean {
  const changesMap = extensionChanges.get(document);
  const key = `${range.start.line}:${range.start.character}`;

  if (!changesMap) {
    return false;
  }

  const change = changesMap.changes.get(key);
  if (!change) {
    return false;
  }

  // Only match if the text is the same
  return change.text === text;
}

/**
 * Mark a change as made by this extension
 * @param document The document where the change was made
 * @param range The range of the change
 * @param text The text that was changed
 */
export function markExtensionChange(document: vscode.TextDocument, range: vscode.Range, text: string): void {
  let changesMap = extensionChanges.get(document);
  const key = `${range.start.line}:${range.start.character}`;

  if (!changesMap) {
    changesMap = {
      changes: new Map(),
      globalTimeout: null
    };
    extensionChanges.set(document, changesMap);
  }

    // Clear any existing timeout for this change
  const existingChange = changesMap.changes.get(key);
  if (existingChange && existingChange.timeout) {
    clearTimeout(existingChange.timeout);
  }

  // Store the change with its text
  const timeout = setTimeout(() => {
    changesMap?.changes.delete(key);

    // If no more changes, clear the global timeout
    if (changesMap?.changes.size === 0) {
      if (changesMap.globalTimeout) {
        clearTimeout(changesMap.globalTimeout);
        changesMap.globalTimeout = null;
      }
      extensionChanges.delete(document);
    }
  }, EXTENSION_CHANGE_TIMEOUT);

  changesMap.changes.set(key, { text, timeout });

    // Set/reset global timeout to clean up if no changes remain
  if (changesMap.globalTimeout) {
    clearTimeout(changesMap.globalTimeout);
  }

  changesMap.globalTimeout = setTimeout(() => {
    if (changesMap?.changes.size === 0) {
      extensionChanges.delete(document);
    }
  }, EXTENSION_CHANGE_TIMEOUT);
}