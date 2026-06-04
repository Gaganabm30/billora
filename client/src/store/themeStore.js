// client/src/store/themeStore.js
import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('billora_theme') || 'dark',

  toggleTheme: () => {
    const current = localStorage.getItem('billora_theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('billora_theme', next);

    const root = window.document.documentElement;
    if (next === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    set({ theme: next });
  },

  initTheme: () => {
    const savedTheme = localStorage.getItem('billora_theme') || 'dark';
    const root = window.document.documentElement;
    if (savedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    set({ theme: savedTheme });
  }
}));
