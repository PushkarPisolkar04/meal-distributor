// Central design tokens. Warm, food-delivery style palette (Swiggy/Zomato/Blinkit
// vibe) with gradients, rounded cards and soft shadows.

export const colors = {
  primary: '#FF5A3C',
  primaryDark: '#E8412A',
  accent: '#FF9F1C',
  pink: '#FF3D77',
  teal: '#0FB5A6',
  green: '#12B76A',
  greenDark: '#0E9F5B',
  amber: '#F79009',
  red: '#F04438',
  blue: '#2E90FA',
  purple: '#7A5AF8',

  ink: '#1D2433',
  body: '#475467',
  muted: '#98A2B3',
  line: '#EAECF0',
  card: '#FFFFFF',
  bg: '#F7F8FA',
  bgWarm: '#FFF6F2',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(16,24,40,0.45)',
} as const;

// Gradient tuples, left->right / top->bottom.
export const gradients = {
  primary: ['#FF7A45', '#FF3D77'] as const,
  sunset: ['#FF9F1C', '#FF5A3C'] as const,
  teal: ['#12D6C4', '#0FB5A6'] as const,
  green: ['#32D583', '#12B76A'] as const,
  violet: ['#9E77ED', '#7A5AF8'] as const,
  sky: ['#53B9FF', '#2E90FA'] as const,
  dark: ['#2B2E4A', '#1D2433'] as const,
  card: ['#FFFFFF', '#FFF6F2'] as const,
} as const;

export type GradientName = keyof typeof gradients;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: colors.ink },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.ink },
  h3: { fontSize: 18, fontWeight: '700' as const, color: colors.ink },
  title: { fontSize: 16, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.body },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.body },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.muted },
  money: { fontSize: 20, fontWeight: '800' as const, color: colors.ink },
} as const;

export const shadow = {
  card: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  soft: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
