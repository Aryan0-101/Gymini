export const theme = {
  colors: {
    // Brand custom colors from Stitch Home Dashboard
    customSand: "#F2E9D8",
    customLinen: "#F8F5F0",
    customMocha: "#5C4A3D",
    customEmber: "#E2725A",
    customApricot: "#F4D8C5",
    customInk: "#26211D",

    // Map the system tokens to the design
    background: "#F2E9D8", // using custom-sand for background
    onBackground: "#26211D",
    surface: "#dbba8d", // using custom-linen for surface
    surfaceMuted: "#F4D8C5", // using custom-apricot
    onSurface: "#26211D",
    onSurfaceVariant: "#5C4A3D", // mocha
    
    primary: "#26211D", // ink
    onPrimary: "#F2E9D8",
    
    secondary: "#5C4A3D",
    onSecondary: "#F2E9D8",
    
    accentFocus: "#E2725A", // ember
    successGraph: "#38A169",
    errorAlert: "#ba1a1a",
    borderSubtle: "#26211D20", // ink with opacity
  },
  typography: {
    displayLg: { fontFamily: 'Unbounded_700Bold', fontSize: 40, letterSpacing: -1 },
    headlineLg: { fontFamily: 'Manrope_700Bold', fontSize: 32, letterSpacing: -0.5 },
    headlineMd: { fontFamily: 'Manrope_600SemiBold', fontSize: 24 },
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
    sm: 4,
    default: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  }
};
