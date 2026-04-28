// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import { getClosingCharacter, getLanguageMappings, getReplacements } from './utilities';
import { isExtensionChange, markExtensionChange } from './cache';
import { isStutteringTemporarilyDisabled, reenableAfterTemporaryDisable } from './commands';

/**
 * Handles text document changes for stuttering functionality
 *
 * @param event The text document change event
 * @param editor The text editor where the change occurred
 * @param mappings The language mappings configuration for stuttering patterns
 * @returns A promise that resolves when all edits are complete
 */
export function handleTextChange(
  event: vscode.TextDocumentChangeEvent,
  editor: vscode.TextEditor,
  mappings: Record<string, {languages: string[], mappings: string[], replace: string}[]>
) {
  const document = event.document;
  const changes = event.contentChanges;
  const reason = event.reason;

  // Only process user-initiated changes
  if (reason === vscode.TextDocumentChangeReason.Undo ||
      reason === vscode.TextDocumentChangeReason.Redo ||
      changes.length === 0) {
    return;
  }

  // Filter out changes made by this extension or empty changes
  const userChanges = changes.filter(change => {
    // Skip empty changes
    if (change.text.length === 0) {
      return false;
    }

    // Skip changes made by this extension
    return !isExtensionChange(document, new vscode.Range(
      document.positionAt(change.rangeOffset),
      document.positionAt(change.rangeOffset + change.text.length)
    ), change.text);
  });

  if (userChanges.length === 0 || isStutteringTemporarilyDisabled()) {
    // If there are no user changes but stuttering was temporarily disabled,
    // re-enable it after any change (even if filtered out)
    reenableAfterTemporaryDisable();
    return;
  }

  //console.log('stuttering:: userChanges', userChanges);

    // Get mappings for the current language and determine the maximum previous text length to check
  const { matchingMappings, maxPreviousLength } = getLanguageMappings(mappings, document.languageId);

  if (Object.keys(matchingMappings).length === 0) {
    return; // No mappings for this language
  }

  //console.log('stuttering:: matchingMappings', matchingMappings, 'maxPreviousLength', maxPreviousLength);

  // Get configuration for escape character and smart close
  const config = vscode.workspace.getConfiguration('stuttering');
  const escape = config.get<boolean>('escape', true);
  const escapeCharacter = config.get<string>('escapeCharacter', "'");
  const smartClose = config.get<boolean>('smartClose', true);

  // Process each user-made change
  const editPromises = userChanges.map(change => {
    return new Promise<void>((resolve) => {
      const text = change.text;
      let baseOffset = change.rangeOffset;

      // Extract the previous text based on the biggest size from the mappings
      let previousText = document.getText(new vscode.Range(
        document.positionAt(Math.max(0, baseOffset - maxPreviousLength)),
        document.positionAt(baseOffset)
      ));

      let closingChar = getClosingCharacter(editor, change.rangeOffset);
      let replacement = '';

      // Process each character in the text
      for (let i = 0; i < text.length; i++) {
        const currentChar = text[i];
        const previous = previousText + replacement;

        if (smartClose && [')', ']', '}'].includes(currentChar)) {
          if (closingChar === null) {
            replacement += currentChar;
          } else {
            replacement += closingChar;
            closingChar = null;
          }
        } else if (Object.keys(matchingMappings).includes(currentChar)) {
          const sequence = matchingMappings[currentChar];

          if (sequence) {
            let matched = false;
            const replacements = getReplacements(currentChar, sequence, document.languageId);

            for (const rep of replacements) {
              if (previous.endsWith(rep.previous)) {
                const fromReplacement = Math.min(rep.previous.length, replacement.length);
                const fromPrevious = rep.previous.length - fromReplacement;

                replacement = replacement.slice(0, -fromReplacement) + rep.replacement;
                if (fromPrevious > 0) {
                  previousText = previousText.slice(0, -fromPrevious);
                  baseOffset -= fromPrevious;
                }
                matched = true;
                break;
              } else if (escape && previous.endsWith(rep.previous + escapeCharacter)) {
                const fromReplacement = Math.min(escapeCharacter.length, replacement.length);
                const fromPrevious = escapeCharacter.length - fromReplacement;

                replacement = replacement.slice(0, -fromReplacement) + (sequence.replace ? sequence.replace : currentChar);
                if (fromPrevious > 0) {
                  previousText = previousText.slice(0, -fromPrevious);
                  baseOffset -= fromPrevious;
                }
                matched = true;
                break;
              }
            }
            if (!matched) {
              if (sequence.replace) {
                replacement += sequence.replace;
              } else {
                replacement += currentChar;
              }
            }
          } else {
            replacement += currentChar;
          }
        } else {
          replacement += currentChar;
        }
      }

      if (baseOffset !== change.rangeOffset || replacement !== text) {
        editor.edit(editBuilder => {
          const editRange = new vscode.Range(
            document.positionAt(baseOffset),
            document.positionAt(change.rangeOffset + text.length)
          );

          editBuilder.replace(editRange, replacement);
          markExtensionChange(document, editRange, replacement);
        }).then(() => resolve());
      } else {
        resolve();
      }
    });
  });

  // Wait for all edits to complete
  return Promise.all(editPromises);
}