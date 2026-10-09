/**
 * Validates and sanitizes redirect paths to prevent Open Redirect vulnerabilities.
 * Ensures the target path is an internal relative route starting with '/'
 * and does not contain external protocol schemes (http://, https://, //, javascript:).
 *
 * @param {string} path - The raw target redirect path.
 * @returns {string|null} - Sanitized relative route string or null if unsafe.
 */
export function getSafeRedirectPath(path) {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();

  // Reject empty strings or external protocol schemes
  if (
    !trimmed ||
    trimmed.startsWith("//") ||
    trimmed.includes("://") ||
    trimmed.toLowerCase().startsWith("javascript:") ||
    trimmed.toLowerCase().startsWith("data:")
  ) {
    return null;
  }

  // Must be an internal relative path starting with '/'
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return null;
}
