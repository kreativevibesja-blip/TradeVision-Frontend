export type PlatformTheme = 'clean-blue' | 'legacy' | 'goldx-premium';

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
  {
    id: 'goldx-premium',
    label: 'GoldX Premium Theme',
    description: 'Black and gold terminal styling with cinematic surfaces, strong contrast, and premium motion.',
  },
];

export const isPlatformTheme = (value: unknown): value is PlatformTheme =>
  value === 'clean-blue' || value === 'legacy' || value === 'goldx-premium';

export const resolvePlatformTheme = (value: unknown, fallback: PlatformTheme = 'clean-blue'): PlatformTheme =>
  isPlatformTheme(value) ? value : fallback;
