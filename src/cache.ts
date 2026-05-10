// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

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
