/**
 * numberGuard.js
 * Simple global guard to prevent negative numbers and scroll-wheel increments in numeric inputs across the app.
 */
export function initGlobalNumberGuard() {
  // 1. Block '-' and 'e' / 'E' keystrokes
  document.addEventListener('keydown', (e) => {
    if (e.target?.type === 'number' && ['-', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  });

  // 2. Prevent negative values on input / paste
  document.addEventListener('input', (e) => {
    if (e.target?.type === 'number' && Number(e.target.value) < 0) {
      e.target.value = '';
    }
  });

  // 3. Prevent mouse wheel from changing values while scrolling
  document.addEventListener(
    'wheel',
    (e) => {
      if (e.target?.type === 'number') {
        e.preventDefault();
        e.target.blur();
      } else if (document.activeElement?.type === 'number') {
        document.activeElement.blur();
      }
    },
    { passive: false }
  );
}
