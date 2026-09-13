// "Kinetic Telemetry HUD" design system — carried over from the original
// Stitch concept (DESIGN.md) so the built app matches the mockup's
// stealth-athletic cockpit look: deep OLED base, volt-green/hyper-orange
// accents, glassmorphic cards, tabular mono telemetry numbers.

export const colors = {
  canvas: '#0a0a0c', // true-black base layer behind everything
  background: '#121318', // chassis surface
  surface: 'rgba(30, 31, 37, 0.72)', // glass card fill (used with BlurView)
  surfaceSolid: '#1a1b20', // solid fallback where blur isn't used
  surfaceHigh: '#292a2f',
  surfaceLow: '#0d0e13',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(0, 255, 102, 0.35)',

  text: '#e3e1e9',
  textMuted: '#8e92a4',
  textFaint: '#5a5e6b',

  primary: '#00ff66', // Cyber Volt — live tracking, primary actions
  onPrimary: '#00220d',
  secondary: '#ff5500', // Hyper Orange — warnings, secondary accents
  onSecondary: '#2a0d00',
  tertiary: '#10b981', // Stealth Emerald — steady-state / confirmed data
  danger: '#ff5500',
} as const;

export const glow = {
  primary: {
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  secondary: {
    shadowColor: colors.secondary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
} as const;

export const fontFamily = {
  display: 'SpaceGrotesk_700Bold',
  headline: 'SpaceGrotesk_600SemiBold',
  headlineMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_700Bold',
  monoMedium: 'JetBrainsMono_500Medium',
  monoLabel: 'JetBrainsMono_600SemiBold',
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
} as const;
