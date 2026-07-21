export const theme = {
  colors: {
    // Spotify Dark Basics
    background: "#090909", // Ultra dark, almost pitch black
    onBackground: "#FFFFFF",
    surface: "#1A1A1A", // Dark grey for cards
    surfaceMuted: "#262626", // Slightly lighter for inner elements
    onSurface: "#FFFFFF",
    onSurfaceVariant: "#A0A0A0", // Secondary text
    
    // Brand Vibrant Accents
    primary: "#FFB347", // Pastel amber-orange
    onPrimary: "#1A1A1A",
    
    secondary: "#82C0CC", // Pastel blue
    onSecondary: "#1A1A1A",
    
    accentFocus: "#E2725A", // Ember/Red
    successGraph: "#1ED760", // Spotify Neon Green
    errorAlert: "#FF4B4B",
    
    // Borders
    borderSubtle: "#333333", // Crisp borders
    borderHighlight: "#404040",
  },
  typography: {
    displayLg: { fontFamily: 'Unbounded_700Bold', fontSize: 40, letterSpacing: -1 },
    headlineLg: { fontFamily: 'Unbounded_700Bold', fontSize: 32, letterSpacing: -0.5 },
    headlineMd: { fontFamily: 'Manrope_700Bold', fontSize: 24 },
    bodyLg: { fontFamily: 'Inter_400Regular', fontSize: 18 },
    bodyMd: { fontFamily: 'Inter_400Regular', fontSize: 16 },
    bodySm: { fontFamily: 'Inter_400Regular', fontSize: 14 },
    labelMd: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 13, letterSpacing: 0.5 },
    labelSm: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, letterSpacing: 1 },
  },
  spacing: {
    unit: 4,
    stackCompact: 8,
    stackDefault: 16,
    gutterPanel: 24,
    stackLoose: 32,
    marginPage: 24,
  },
  rounded: {
    sm: 6,
    default: 12, // Chunky Duolingo style
    md: 16,
    lg: 24, // Very rounded cards
    xl: 32,
    full: 9999,
  }
};
