import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(ThemeMode.LIGHT);

  // Function to update theme and DOM
  const updateTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (newTheme === ThemeMode.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  // Initialize theme from local storage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === ThemeMode.DARK) {
      updateTheme(ThemeMode.DARK);
    } else if (savedTheme === ThemeMode.LIGHT) {
      updateTheme(ThemeMode.LIGHT);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      updateTheme(ThemeMode.DARK);
    } else {
      updateTheme(ThemeMode.LIGHT);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
    updateTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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