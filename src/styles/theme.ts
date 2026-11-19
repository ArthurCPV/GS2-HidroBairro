export type ThemeMode = 'system' | 'light' | 'dark';
export type ColorScheme = Exclude<ThemeMode, 'system'>;

export type AppTheme = {
  colors: {
    background: string;
    surface: string;
    heading: string;
    body: string;
    muted: string;
    action: string;
    actionSurface: string;
    border: string;
    control: string;
    error: string;
    errorSurface: string;
    warning: string;
    warningSurface: string;
  };
  spacing: {
    page: number;
    element: number;
    compact: number;
  };
  radius: {
    control: number;
  };
  typography: {
    heading: number;
    body: number;
    bodyLine: number;
  };
};

export const themes: Record<ColorScheme, AppTheme> = {
  light: {
    colors: {
      background: '#F5F8F7',
      surface: '#FFFFFF',
      heading: '#183B3A',
      body: '#526563',
      muted: '#71817F',
      action: '#14665F',
      actionSurface: '#E2F0EC',
      border: '#B7C7C2',
      control: '#EEF3F2',
      error: '#A33B32',
      errorSurface: '#FDECEA',
      warning: '#805600',
      warningSurface: '#FFF3D6',
    },
    spacing: { page: 24, element: 16, compact: 12 },
    radius: { control: 12 },
    typography: { heading: 28, body: 16, bodyLine: 24 },
  },
  dark: {
    colors: {
      background: '#101817',
      surface: '#192321',
      heading: '#E8F3F0',
      body: '#B7C8C3',
      muted: '#94A9A2',
      action: '#7DD4C4',
      actionSurface: '#203F39',
      border: '#31423E',
      control: '#202C29',
      error: '#FFB4AB',
      errorSurface: '#442824',
      warning: '#F2C66D',
      warningSurface: '#453710',
    },
    spacing: { page: 24, element: 16, compact: 12 },
    radius: { control: 12 },
    typography: { heading: 28, body: 16, bodyLine: 24 },
  },
};
