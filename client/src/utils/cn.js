import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx support
 * Handles conditional classes and deduplication
 */
export const cn = (...inputs) => twMerge(clsx(inputs));