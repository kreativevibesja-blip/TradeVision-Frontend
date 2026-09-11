export type PlatformTheme = 'clean-blue' | 'legacy';

export const PLATFORM_THEME_SETTING_KEY = 'platform_theme_active';

export const platformThemes: Array<{
  id: PlatformTheme;
  label: string;
  description: string;
}> = [
  {
    id: 'clean-blue',
    label: 'Clean Blue',
    description: 'Modern white SaaS interface with blue accents, clean cards, and social trading workspace layouts.',
  },
  {
    id: 'legacy',
    label: 'Legacy Theme',
    description: 'The original dark TradeVision look for continuity across existing workflows.',
  },
];

export const isPlatformTheme = (value: unknown): value is PlatformTheme =>
  value === 'clean-blue' || value === 'legacy';

export const resolvePlatformTheme = (value: unknown, fallback: PlatformTheme = 'clean-blue'): PlatformTheme =>
  isPlatformTheme(value) ? value : fallback;
