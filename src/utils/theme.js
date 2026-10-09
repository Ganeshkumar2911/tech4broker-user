/**
 * Theme helper utilities
 */
export const setTheme = (theme) => {
  if (typeof document === 'undefined') return
  const html = document.documentElement

  if (theme === 'dark' || theme === true) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

export const getTheme = () => {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export const initTheme = () => {
  // Default to light theme on fresh boot
  setTheme('light')
  return 'light'
}

export const toggleTheme = () => {
  const current = getTheme()
  const newTheme = current === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
  return newTheme
}