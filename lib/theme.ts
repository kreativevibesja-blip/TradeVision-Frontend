export type PlatformTheme = 'legacy' | 'goldx-premium';

export const PLATFORM_THEME_SETTING_KEY = 'platform_theme_active';

export const platformThemes: Array<{
  id: PlatformTheme;
  label: string;
  description: string;
}> = [
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
  value === 'legacy' || value === 'goldx-premium';

export const resolvePlatformTheme = (value: unknown, fallback: PlatformTheme = 'goldx-premium'): PlatformTheme =>
  isPlatformTheme(value) ? value : fallback;