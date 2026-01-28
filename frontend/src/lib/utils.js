/**
 * Simple utility to merge class names.
 * Simulates clsx behavior.
 */
export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
