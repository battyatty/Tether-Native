import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorTheme, deepwakeTheme, tidewakeTheme } from '../theme/colors';

type ThemeName = 'deepwake' | 'tidewake';

interface ThemeContextType {
  theme: ColorTheme;
  themeName: ThemeName;
  toggleTheme: () => void;
  setTheme: (themeName: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_preference';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>('deepwake');
  const [theme, setTheme] = useState<ColorTheme>(deepwakeTheme);

  // Load saved theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when themeName changes
  useEffect(() => {
    const newTheme = themeName === 'deepwake' ? deepwakeTheme : tidewakeTheme;
    setTheme(newTheme);
    saveThemePreference(themeName);
  }, [themeName]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'deepwake' || savedTheme === 'tidewake')) {
        setThemeName(savedTheme as ThemeName);
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
      // Default to deepwake theme
    }
  };

  const saveThemePreference = async (theme: ThemeName) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    setThemeName(prev => prev === 'deepwake' ? 'tidewake' : 'deepwake');
  };

  const handleSetTheme = (newThemeName: ThemeName) => {
    setThemeName(newThemeName);
  };

  const value: ThemeContextType = {
    theme,
    themeName,
    toggleTheme,
    setTheme: handleSetTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
