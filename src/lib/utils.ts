import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes text data to prevent JSON encoding issues
 * Removes invalid Unicode surrogates that can cause "no low surrogate" errors
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/[\uD800-\uDFFF]/g, '') // Remove invalid Unicode surrogates
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\uFEFF/g, '') // Remove BOM
    .trim();
}

/**
 * Sanitizes text for JSON serialization
 * More aggressive cleaning for API requests
 */
export function sanitizeForJSON(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/[\uD800-\uDFFF]/g, '') // Remove invalid Unicode surrogates
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\uFEFF/g, '') // Remove BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Sanitizes an object's string properties to prevent encoding issues
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, stringFields: (keyof T)[]): T {
  const sanitized = { ...obj };
  stringFields.forEach(field => {
    if (typeof sanitized[field] === 'string' || sanitized[field] === null || sanitized[field] === undefined) {
      sanitized[field] = sanitizeText(sanitized[field]) as T[keyof T];
    }
  });
  return sanitized;
}

/**
 * Sanitizes TV display content to prevent JSON encoding issues
 */
export function sanitizeTVContent(content: string | null | undefined): string {
  if (!content) return '';
  return sanitizeForJSON(content);
}
