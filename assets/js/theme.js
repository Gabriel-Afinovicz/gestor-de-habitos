// FitHabit - Sistema de tema claro/escuro
// Responsável por:
// - Ler o tema salvo no localStorage
// - Aplicar o tema (light/dark) via atributo data-theme no <html>
// - Controlar o toggle de tema na navbar
// - Re-renderizar o gráfico, se existir, para respeitar as novas cores

(() => {
  const THEME_STORAGE_KEY = 'fithabit-theme';
  const THEME_LIGHT = 'light';
  const THEME_DARK = 'dark';

  /**
   * Lê o tema salvo no localStorage.
   * Se não houver valor, retorna "light" como padrão.
   */
  const getStoredTheme = () => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === THEME_LIGHT || stored === THEME_DARK) {
        return stored;
      }
    } catch (error) {
      console.warn('[FitHabitTheme] Não foi possível ler o tema salvo:', error);
    }
    return THEME_LIGHT;
  };

  /**
   * Salva o tema escolhido no localStorage.
   */
  const storeTheme = (theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('[FitHabitTheme] Não foi possível salvar o tema:', error);
    }
  };

  /**
   * Aplica o tema recebido:
   * - Seta data-theme="light|dark" no <html>
   * - Salva em localStorage
   * - Pede para o módulo principal re-renderizar o gráfico (se disponível)
   */
  const applyTheme = (theme) => {
    const root = document.documentElement;
    const normalized = theme === THEME_DARK ? THEME_DARK : THEME_LIGHT;

    root.setAttribute('data-theme', normalized);
    storeTheme(normalized);

    // Se o módulo principal FitHabit estiver carregado, re-renderiza o gráfico
    if (window.FitHabit && typeof window.FitHabit.renderHabitsProgressChart === 'function') {
      window.FitHabit.renderHabitsProgressChart();
    }
  };

  /**
   * Inicializa o tema com base no valor salvo em localStorage.
   */
  const initThemeFromStorage = () => {
    const stored = getStoredTheme();
    applyTheme(stored);
  };

  /**
   * Sincroniza o estado do switch visual com o tema atual salvo.
   */
  const syncThemeToggleWithCurrentTheme = () => {
    const checkbox = document.getElementById('themeToggleSwitch');
    if (!checkbox) return;

    const currentTheme = getStoredTheme();
    checkbox.checked = currentTheme === THEME_DARK;
  };

  /**
   * Alterna entre tema claro e escuro usando o valor salvo/atual.
   * Mantido para compatibilidade com outros módulos (ex.: debugging).
   */
  const toggleTheme = () => {
    const current = getStoredTheme();
    const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    applyTheme(next);
  };

  // Inicialização global do sistema de tema
  document.addEventListener('DOMContentLoaded', () => {
    initThemeFromStorage();

    const checkbox = document.getElementById('themeToggleSwitch');
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        const newTheme = checkbox.checked ? THEME_DARK : THEME_LIGHT;
        applyTheme(newTheme);
      });
    }

    syncThemeToggleWithCurrentTheme();
  });

  // Expõe uma pequena API para debugging / uso em vídeo
  window.FitHabitTheme = {
    applyTheme,
    initThemeFromStorage,
    toggleTheme,
    getStoredTheme,
  };
})();


