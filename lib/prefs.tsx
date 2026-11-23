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
    <div className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/85 p-1 shadow-xs backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/80">
      <Globe className="mx-1 size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="flex items-center gap-0.5 rounded-full bg-slate-100 p-0.5 dark:bg-slate-800/80" role="group" aria-label={t('common.language')}>
        {(['id', 'en'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`min-w-8 rounded-full px-2 py-1 text-xs font-semibold uppercase transition-all duration-150 cursor-pointer ${
              lang === l
                ? 'bg-white text-teal-800 shadow-xs dark:bg-teal-700 dark:text-teal-50'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <span className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
      <button
        type="button"
        onClick={toggleTheme}
        title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
        aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
        className="grid size-8 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-300"
      >
        <Sun className="hidden size-4 text-amber-400 dark:block" aria-hidden="true" />
        <Moon className="size-4 dark:hidden" aria-hidden="true" />
      </button>
    </div>
  );
}
