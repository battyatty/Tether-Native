/**
 * TetherApp Color Theme System
 * 
 * This file defines the color themes used throughout the application.
 * 
 * THEMES:
 * - Deepwake: Dark mode theme (currently active)
 * - Tidewake: Light mode theme (future implementation)
 * 
 * COLOR USAGE GUIDE:
 * 
 * ANCHOR LIGHT (#BF92FF):
 * - Used for anchored/scheduled items that must occur at specific times
 * - Applied to scheduled tethers, time-locked tasks, and fixed timing elements
 * - Represents constraint and temporal anchoring
 * 
 * TIDEWAKE TIMER (#00BFA5):
 * - Primary accent color for flexible/flow-based elements
 * - Used for flexible tethers, progress indicators, and dynamic timing
 * - Represents flexibility and natural flow
 */

export interface ColorTheme {
  // Background Colors
  background: {
    primary: string;      // Main app background
    secondary: string;    // Card backgrounds
    tertiary: string;     // Elevated surfaces
  };
  
  // Text Colors
  text: {
    primary: string;      // Main text
    secondary: string;    // Subtitle/secondary text
    tertiary: string;     // Muted/placeholder text
    quaternary: string;   // Very muted text
    inverse: string;      // Text on colored backgrounds
  };
  
  // Border Colors
  border: {
    primary: string;      // Default borders
    secondary: string;    // Subtle borders
  };
  
  // Accent Colors
  accent: {
    anchorLight: string;  // Scheduled/anchored items (#BF92FF)
    tidewake: string;     // Flexible/flow items (#00BFA5)
    warning: string;      // Warnings and alerts
    danger: string;       // Errors and destructive actions
    success: string;      // Success states
  };
  
  // Status Colors
  status: {
    error: string;
    errorBackground: string;
    errorBorder: string;
  };
  
  // Transparent/Overlay Colors
  overlay: {
    transparent: string;
    semiTransparent: string;
  };
  
  // Semantic Colors
  semantic: {
    // Tether Types
    scheduledTether: string;  // Uses anchorLight for time-anchored tethers
    flexibleTether: string;   // Uses tidewake for flexible tethers
    
    // Task States
    anchoredTask: string;     // Tasks with fixed start times
    flexibleTask: string;     // Tasks with flexible timing
    
    // Progress & Status
    progress: string;         // Progress bars and completion
    active: string;           // Active/running states
    paused: string;           // Paused states
  };
}

// DEEPWAKE THEME (Dark Mode)
export const deepwakeTheme: ColorTheme = {
  background: {
    primary: '#0F172A',      // Main dark blue background
    secondary: '#1E293B',    // Card/elevated background
    tertiary: '#334155',     // Higher elevation surfaces
  },
  
  text: {
    primary: '#E2E8F0',      // Main white/light text
    secondary: '#CBD5E1',    // Secondary light text
    tertiary: '#94A3B8',     // Muted gray text
    quaternary: '#64748B',   // Very muted gray text
    inverse: '#FFFFFF',      // White text on colored backgrounds
  },
  
  border: {
    primary: '#334155',      // Default borders
    secondary: '#475569',    // Slightly lighter borders
  },
  
  accent: {
    anchorLight: '#BF92FF',  // Purple for anchored/scheduled items
    tidewake: '#00BFA5',     // Teal for flexible/flow items
    warning: '#FFA500',      // Orange for warnings
    danger: '#EF4444',       // Red for errors
    success: '#10B981',      // Green for success
  },
  
  status: {
    error: '#B91C1C',
    errorBackground: '#FEF2F2',
    errorBorder: '#FECACA',
  },
  
  overlay: {
    transparent: 'transparent',
    semiTransparent: 'rgba(0, 0, 0, 0.5)',
  },
  
  semantic: {
    // Tether Types
    scheduledTether: '#BF92FF',  // Anchor light for scheduled tethers
    flexibleTether: '#00BFA5',   // Tidewake for flexible tethers
    
    // Task States
    anchoredTask: '#BF92FF',     // Anchor light for time-locked tasks
    flexibleTask: '#00BFA5',     // Tidewake for flexible tasks
    
    // Progress & Status
    progress: '#00BFA5',         // Tidewake for progress
    active: '#10B981',           // Green for active states
    paused: '#FFA500',           // Orange for paused states
  },
};

// TIDEWAKE THEME (Light Mode) - Future Implementation
export const tidewakeTheme: ColorTheme = {
  background: {
    primary: '#FFFFFF',      // White background
    secondary: '#F8FAFC',    // Light gray background
    tertiary: '#E2E8F0',     // Elevated surfaces
  },
  
  text: {
    primary: '#1E293B',      // Dark text
    secondary: '#475569',    // Medium gray text
    tertiary: '#64748B',     // Light gray text
    quaternary: '#94A3B8',   // Very light gray text
    inverse: '#FFFFFF',      // White text on colored backgrounds
  },
  
  border: {
    primary: '#E2E8F0',      // Light borders
    secondary: '#CBD5E1',    // Medium borders
  },
  
  accent: {
    anchorLight: '#BF92FF',  // Same purple for anchored items
    tidewake: '#00BFA5',     // Same teal for flexible items
    warning: '#F59E0B',      // Adjusted orange for light mode
    danger: '#EF4444',       // Same red
    success: '#10B981',      // Same green
  },
  
  status: {
    error: '#B91C1C',
    errorBackground: '#FEF2F2',
    errorBorder: '#FECACA',
  },
  
  overlay: {
    transparent: 'transparent',
    semiTransparent: 'rgba(0, 0, 0, 0.3)',
  },
  
  semantic: {
    // Tether Types
    scheduledTether: '#BF92FF',  // Anchor light for scheduled tethers
    flexibleTether: '#00BFA5',   // Tidewake for flexible tethers
    
    // Task States
    anchoredTask: '#BF92FF',     // Anchor light for time-locked tasks
    flexibleTask: '#00BFA5',     // Tidewake for flexible tasks
    
    // Progress & Status
    progress: '#00BFA5',         // Tidewake for progress
    active: '#10B981',           // Green for active states
    paused: '#F59E0B',           // Adjusted orange for paused states
  },
};

// Current active theme (Deepwake) - for components not yet using ThemeContext
export const colors = deepwakeTheme;

// Theme selection helper (for future theme switching)
export const getTheme = (themeName: 'deepwake' | 'tidewake' = 'deepwake'): ColorTheme => {
  return themeName === 'deepwake' ? deepwakeTheme : tidewakeTheme;
};

// Export individual color groups for convenience
export const { background, text, border, accent, status, overlay, semantic } = colors;

// Legacy color exports (for gradual migration)
export const COLORS = colors;

// Hook for using colors in components (can be extended to use ThemeContext in the future)
export const useColors = () => {
  // For now, return the static deepwake theme
  // In the future, this will use the ThemeContext to return dynamic colors
  return colors;
};

export default colors;
