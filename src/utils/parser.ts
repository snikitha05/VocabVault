import type { Flashcard } from '../types';

export interface ParseResult {
  cards: Omit<Flashcard, 'id'>[];
  errors: { line: number; text: string; reason: string }[];
}

export function parseVocabularyText(text: string): ParseResult {
  const lines = text.split('\n');
  const cards: Omit<Flashcard, 'id'>[] = [];
  const errors: { line: number; text: string; reason: string }[] = [];

  // Regex to match "word - meaning" or "word : meaning"
  // ^\s*(.*?)\s*(?:[-:])\s*(.*?)\s*$
  const regex = /^\s*(.+?)\s*(?:[-:])\s*(.+?)\s*$/;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (!trimmed) {
      return; // Skip empty lines
    }

    const match = trimmed.match(regex);

    if (match && match[1] && match[2]) {
      cards.push({
        word: match[1],
        meaning: match[2],
        status: 'learning',
        timesStudied: 0,
        timesKnown: 0,
        timesUnknown: 0,
      });
    } else {
      errors.push({
        line: lineNumber,
        text: trimmed,
        reason: 'Missing separator (- or :) or missing word/meaning',
      });
    }
  });

  return { cards, errors };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}
