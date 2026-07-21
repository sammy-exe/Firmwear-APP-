import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <div className={`theme-toggle ${dark ? 'dark' : 'light'}`} onClick={toggle}>
      <div className="tog-eye" />
      <div className="tog-eye" />
    </div>
  );
}
