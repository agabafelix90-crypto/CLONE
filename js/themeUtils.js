export const VALID_THEMES = ['blue', 'white', 'dark', 'system'];

export function normalizeTheme(theme) {
  if (!theme || typeof theme !== 'string') return null;
  const value = theme.trim().toLowerCase();
  if (value === 'auto') return 'system';
  if (VALID_THEMES.includes(value)) return value;
  return null;
}

export function getSystemPreferredTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'blue';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'blue';
}

export function resolveTheme(themeParam, securityColor = '') {
  const normalizedTheme = normalizeTheme(themeParam);
  if (normalizedTheme === 'system') return getSystemPreferredTheme();
  if (normalizedTheme === 'dark') return 'blue';
  if (normalizedTheme === 'white') return 'white';
  if (normalizedTheme === 'blue') return 'blue';

  const color = String(securityColor || '').trim().toLowerCase();
  if (!color || color === 'white' || color === 'null') return 'white';

  return 'blue';
}

export function parseThemeFromSearch(search) {
  try {
    const params = new URLSearchParams(search || window.location.search);
    return normalizeTheme(params.get('theme'));
  } catch {
    return null;
  }
}

export function setThemeParamInPath(path, themeParam) {
  const normalizedTheme = normalizeTheme(themeParam);
  if (!normalizedTheme) return path;

  const [pathOnly, query] = path.split('?');
  const params = new URLSearchParams(query || '');
  params.set('theme', normalizedTheme);
  return `${pathOnly}?${params.toString()}`;
}
