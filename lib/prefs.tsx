'use client';
import { Globe, Moon, Sun } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { translate, type I18nKey, type Lang } from './i18n';

export type Theme = 'light' | 'dark';

type PrefsCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: I18nKey, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<PrefsCtx | null>(null);
const THEME_KEY = 'arunika_theme';
const LANG_KEY = 'arunika_lang';

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [lang, setLangState] = useState<Lang>('id');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') setThemeState(savedTheme);
      else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setThemeState('dark');
      const savedLang = localStorage.getItem(LANG_KEY);
      if (savedLang === 'en' || savedLang === 'id') setLangState(savedLang);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
  }, [lang]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState((p) => (p === 'dark' ? 'light' : 'dark')), []);
  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(() => setLangState((p) => (p === 'id' ? 'en' : 'id')), []);
  const t = useCallback((key: I18nKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  return <Ctx.Provider value={{ theme, setTheme, toggleTheme, lang, setLang, toggleLang, t }}>{children}</Ctx.Provider>;
}

export function usePrefs(): PrefsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      theme: 'light', setTheme: () => {}, toggleTheme: () => {},
      lang: 'id', setLang: () => {}, toggleLang: () => {},
      t: (key, vars) => translate('id', key, vars),
    };
  }
  return ctx;
}

export function ThemeLangControls() {
  const { theme, toggleTheme, lang, setLang, t } = usePrefs();
  return (
    <div className="flex items-center gap-1.5">
      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800" role="group" aria-label="Language">
        <Globe className="mx-1.5 size-3.5 text-slate-400 dark:text-slate-400" />
        {(['id', 'en'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={`rounded-md px-2 py-1 font-medium uppercase transition-colors ${
              lang === l
                ? 'bg-white text-teal-800 shadow-xs dark:bg-slate-700 dark:text-teal-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
        aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
        className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
      >
        {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
      </button>
    </div>
  );
}
