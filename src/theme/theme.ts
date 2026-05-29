export const COLORS = {
  primary: '#2DC7FF',
  primaryContainer: '#00506A', // from on-primary-container
  primaryGradientEnd: '#00B4F5',
  
  background: '#F9F9F9',
  surface: '#FFFFFF', // Float cards base
  surfaceDim: '#DADADA',
  surfaceHighlight: '#F0F9FF', // Very Light Blue for sectioning
  
  text: '#1A1C1C',
  textSecondary: '#576065',
  textInverse: '#FFFFFF',
  
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  
  border: '#BCC8D0', // outline-variant
  borderGlass: 'rgba(255, 255, 255, 0.4)', // 40% white border
  
  shadowTint: 'rgba(45, 199, 255, 0.1)', // #2DC7FF at 10%
  glassBackground: 'rgba(255, 255, 255, 0.7)',
};

export const TYPOGRAPHY = {
  displayLarge: {
    fontFamily: 'Poppins',
    fontSize: 40,
    fontWeight: '600' as const,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  headlineLarge: {
    fontFamily: 'Poppins',
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '500' as const,
    lineHeight: 32,
  },
  bodyLarge: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
  bodyMedium: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  labelLarge: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  labelSmall: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};

export const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 64,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 9999,
};

export const SHADOWS = {
  glass: {
    shadowColor: '#2DC7FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 5,
  },
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#2DC7FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
};

