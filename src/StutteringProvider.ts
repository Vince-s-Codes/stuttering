// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import {
  getClosingCharacter,
  getLanguageMappings,
  getReplacements,
  getIndent,
  fixReplacement,
  insertAtIndex,
  removeAtIndex,
  MappingConfig
} from './utilities';
import { isStutteringTemporarilyDisabled, reenableAfterTemporaryDisable } from './commands';
import { debug, error, note, warning } from './log';

interface StutteringConfig {
  mappings: Record<string, {languages: string[], mappings: string[], replace: string}[]>;
  processMultiLine: boolean;
  escape: boolean;
  escapeCharacter: string;
  smartClose: boolean;
  positionMarker: boolean;
  positionMarkerCharacter: string;
  singleCharOnly: boolean;
}

let currentChange: {count: number, replacement: {replacement: string, index: number}, range: vscode.Range, text: string} | null = null;
const onGoingChanges : {
  change: vscode.TextDocumentContentChangeEvent,
  config: StutteringConfig,
  document: vscode.TextDocument,
  editor: vscode.TextEditor,
  matchingMappings: Record<string, MappingConfig>,
  maxPreviousLength: number,
  selections: vscode.Selection[]
}[] = [];

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
  config: StutteringConfig
) {
  const document = event.document;
  const changes = event.contentChanges;
  const reason = event.reason;
  const {
    mappings,
    processMultiLine,
    singleCharOnly
  } = config;

  // Only process user-initiated changes
  if (reason === vscode.TextDocumentChangeReason.Undo ||
      reason === vscode.TextDocumentChangeReason.Redo ||
      changes.length === 0) {
    return;
  }

  if (currentChange !== null &&
      changes.length === currentChange.count &&
      changes[0].text === currentChange.replacement.replacement &&
      changes[0].range.isEqual(currentChange.range)) {
    note(handleTextChange, 'Current edition callback');
    return;
  } else if(currentChange !==  null && changes.length === currentChange.count) {
    debug(handleTextChange,
          'currentChange:', currentChange,
          'change:', changes[0],
          'isEqual:', changes[0].range.isEqual(currentChange.range),
          'startEqual:', changes[0].range.start.isEqual(currentChange.range.start),
          'endEqual:', changes[0].range.end.isEqual(currentChange.range.end));
  }

  // Get mappings for the current language and determine the maximum previous text length to check
  const { matchingMappings, maxPreviousLength } = getLanguageMappings(mappings, document.languageId);

  if (Object.keys(matchingMappings).length === 0) {
    note(handleTextChange, 'Skip stuttering, no mapping configured');
    return; // No mappings for this language
  }

  // Filter out changes made by this extension or empty changes
  const userChanges = changes.filter(change => {
    // Skip empty changes
    if (change.text.length === 0) {
      return false;
    }

    // If single character only is enabled, skip changes that are not a single character
    if (singleCharOnly && change.text.length !== 1) {
      return false;
    }

    // If multi-line processing is disabled, skip changes that span multiple lines
    if (!processMultiLine) {
      const startPos = document.positionAt(change.rangeOffset);
      const endPos = document.positionAt(change.rangeOffset + change.text.length + 1);

      if (startPos.character === 0 && startPos.line !== endPos.line) {
        return false;
      }
    }
    return true;
  });

  if (userChanges.length === 0 || isStutteringTemporarilyDisabled()) {
    // If there are no user changes but stuttering was temporarily disabled,
    // re-enable it after any change (even if filtered out)
    reenableAfterTemporaryDisable();
    return;
  }

  const runChange = (onGoingChanges.length === 0);
  userChanges.map(change => {
    if(!onGoingChanges.some(onGoingChange => {
      if(onGoingChange.change.text !== change.text) {
        return false;
      }
      return onGoingChange.selections.some(selection => {
        return selection.contains(change.range.start) || selection.contains(change.range.end);
      });
    })) {
      onGoingChanges.push({
        change: change,
        config: config,
        document: document,
        editor: editor,
        matchingMappings: matchingMappings,
        maxPreviousLength: maxPreviousLength,
        selections: editor.selections.map(selection => new vscode.Selection(selection.start, selection.end))
      });
      debug(handleTextChange, 'append changes::',
            'change:', change,
            'onGoingChanges count:', onGoingChanges.length);
    } else {
      note(handleTextChange, 'filter change already taken care of::',
           'change:', change);
    }
  });
  if (runChange) {
    performStuttering();
  }
}

/**
 * Processes stuttering patterns for text changes in the editor.
 *
 * This function handles the core logic of the stuttering functionality, processing each character
 * in the changed text and applying appropriate replacements based on the configured mappings.
 * It manages the cursor position, indentation, and handles special cases like escape characters
 * and smart closing of brackets/parentheses.
 *
 * @param secondTry - If true, indicates this is a retry attempt after a failed edit (default: false)
 */
function performStuttering(secondTry = false) {
  const onGoingChange = onGoingChanges[0];

  if (onGoingChange) {
    const change = onGoingChange.change;
    const config = onGoingChange.config;
    const document = onGoingChange.document;
    const editor = onGoingChange.editor;
    const matchingMappings = onGoingChange.matchingMappings;
    const maxPreviousLength = onGoingChange.maxPreviousLength;
    const selections = onGoingChange.selections;
    const text = change.text;
    const {
      escape,
      escapeCharacter,
      smartClose,
      positionMarker,
      positionMarkerCharacter
    } = config;
    let baseOffset = document.offsetAt(change.range.start);
    const originalOffset = baseOffset;

    // Get the indentation of the current line
    const indent = getIndent(document, baseOffset);

    // Extract the previous text based on the biggest size from the mappings
    let previousText = document.getText(new vscode.Range(
      document.positionAt(Math.max(0, baseOffset - maxPreviousLength)),
      document.positionAt(baseOffset)
    ));

    let closingChar = getClosingCharacter(editor, change.rangeOffset);
    let replacement = {replacement: '', index: 0};

    debug(performStuttering,
          'text:', text,
          'baseOffset:', baseOffset,
          'closingChar:', closingChar,
          'line:', change.range.start.line,
          'column:', change.range.start.character,
          'previousText:', previousText.replaceAll('\n', '\\n'));

    // Process each character in the text
    for (let i = 0; i < text.length; i++) {
      const currentChar = text[i];
      const previous = previousText + replacement.replacement;

      if (smartClose && [')', ']', '}'].includes(currentChar)) {
        replacement = insertAtIndex(replacement, (closingChar === null ? currentChar : closingChar), false, positionMarkerCharacter);
        closingChar = null;
      } else if (Object.keys(matchingMappings).includes(currentChar)) {
        const sequence = matchingMappings[currentChar];

        if (sequence) {
          let matched = false;
          const replacements = getReplacements(currentChar, sequence, document.languageId);

          for (const rep of replacements) {
            if (previous.endsWith(rep.previous)) {
              const fromReplacement = Math.min(rep.previous.length, replacement.index);
              const fromPrevious = rep.previous.length - fromReplacement;
              const fixedReplacement = fixReplacement(rep.replacement, indent);

              replacement = removeAtIndex(replacement, fromReplacement);
              replacement = insertAtIndex(replacement, fixedReplacement, positionMarker, positionMarkerCharacter);
              if (fromPrevious > 0) {
                previousText = previousText.slice(0, -fromPrevious);
                baseOffset -= fromPrevious;
              }
              matched = true;
              break;
            } else if (escape && previous.endsWith(rep.previous + escapeCharacter)) {
              const fromReplacement = Math.min(escapeCharacter.length, replacement.index);
              const fromPrevious = escapeCharacter.length - fromReplacement;

              replacement = removeAtIndex(replacement, fromReplacement);
              replacement = insertAtIndex(replacement, (sequence.replace ? sequence.replace : currentChar), sequence.replace ? positionMarker : false, positionMarkerCharacter);
              if (fromPrevious > 0) {
                previousText = previousText.slice(0, -fromPrevious);
                baseOffset -= fromPrevious;
              }
              matched = true;
              break;
            }
          }
          if (!matched) {
            replacement = insertAtIndex(replacement, (sequence.replace ? sequence.replace : currentChar),
                                        sequence.replace ? positionMarker : false, positionMarkerCharacter);
          }
        } else {
          replacement = insertAtIndex(replacement, currentChar, false, positionMarkerCharacter);
        }
      } else {
        replacement = insertAtIndex(replacement, currentChar, false, positionMarkerCharacter);
      }
    }

    if (baseOffset !== originalOffset || replacement.replacement !== text) {
      const editRange = new vscode.Range(
        change.range.start.translate(0, baseOffset - originalOffset),
        change.range.end.translate(0, text.length)
      );

      debug(performStuttering,
            'change:', change,
            'editRange:', editRange,
            'baseOffset:', baseOffset,
            'replacement:', replacement);
      currentChange = {count: selections.length,
                       replacement: replacement,
                       range: editRange,
                       text: change.text};
      editor.edit(editBuilder => {
        selections.forEach(selection => {
          const startPosition = selection.start.translate(0, baseOffset - originalOffset);
          const endPosition = selection.end.translate(0, text.length);

          debug(performStuttering,
                'selection:', selection,
                'startPosition:', startPosition,
                'endPosition:', endPosition);
          editBuilder.replace(new vscode.Selection(startPosition, endPosition), replacement.replacement);
        });
      }).then((success) => {
        if (success) {
          currentChange = null;
          if (positionMarker && replacement.index !== replacement.replacement.length) {
            let sels : vscode.Selection[] = [];

            try {
              editor.selections.forEach(selection => {
                const startPosition = document.positionAt(document.offsetAt(selection.start) - replacement.replacement.length + replacement.index);
                const endPosition = document.positionAt(document.offsetAt(selection.end) - replacement.replacement.length + replacement.index);

                sels.push(new vscode.Selection(startPosition, endPosition));
              });
              debug(performStuttering,
                    'editor.selections:', editor.selections,
                    'sels:', sels);
              editor.selections = sels;
            } catch(e) {
              error(performStuttering, e);
            }
          }
          onGoingChanges.shift();
          if (onGoingChanges.length > 0) {
            performStuttering();
          } else {
            note(performStuttering, 'done performing all on-going stuttering');
          }
        } else {
          warning(performStuttering, 'Fail to perform stuttering due to multiple edits');
          if (secondTry) {
            onGoingChanges.shift();
            if (onGoingChanges.length > 0) {
              performStuttering();
            } else {
              note(performStuttering, 'done performing all on-going stuttering');
            }
          } else {
            performStuttering(true);
          }
        }
      });
    } else {
      onGoingChanges.shift();
      if (onGoingChanges.length > 0) {
        performStuttering();
      } else {
        note(performStuttering, 'done performing all on-going stuttering');
      }
    }
  } else {
    warning(performStuttering, 'function called without changes on-going!');
  }
}