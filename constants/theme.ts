export const Colors = {
  primary: '#6366F1', // Indigo/Purple for primary actions
  primaryLight: '#E0E7FF',
  
  emergency: '#EF4444', // Red for emergency
  emergencyDark: '#DC2626',
  emergencyLight: '#FEE2E2',
  
  success: '#22C55E', // Green for calm/success
  successLight: '#DCFCE7',
  
  warning: '#F59E0B', // Amber/Yellow for stress
  warningLight: '#FEF3C7',
  
  danger: '#EF4444', // Red for panic
  dangerLight: '#FEE2E2',
  
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceHover: '#F3F4F6',
  
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  white: '#FFFFFF',
  black: '#000000',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const getEmotionalStateColor = (state: 'calmado' | 'estres' | 'panico') => {
  switch (state) {
    case 'calmado':
      return { primary: Colors.success, light: Colors.successLight };
    case 'estres':
      return { primary: Colors.warning, light: Colors.warningLight };
    case 'panico':
      return { primary: Colors.danger, light: Colors.dangerLight };
  }
};
