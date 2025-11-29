// FitHabit - módulo principal de hábitos e progresso
// Responsável por:
// - Ler / salvar hábitos no localStorage
// - Calcular progresso diário (últimos 7 dias)
// - Renderizar / atualizar o gráfico com Chart.js
// - Sincronizar a barra "Hábitos Concluídos" do dashboard

(() => {
  const HABITS_STORAGE_KEY = 'habits';

  // ---------- Helpers de data ----------

  /**
   * Retorna a data de hoje no formato YYYY-MM-DD (padrão para completedDates).
   */
  const getTodayISODate = () => new Date().toISOString().slice(0, 10);

  /**
   * Formata uma data (objeto Date) para ISO (AAAA-MM-DD).
   */
  const toISODate = (date) => date.toISOString().slice(0, 10);

  /**
   * Gera os últimos N dias (incluindo hoje) como
   * { iso: 'YYYY-MM-DD', label: 'Seg 25/11' }.
   */
  const getLastNDays = (n) => {
    const today = new Date();
    const days = [];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = n - 1; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = toISODate(d);
      const dayName = weekDays[d.getDay()];
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');

      days.push({
        iso,
        label: `${dayName} ${day}/${month}`,
      });
    }

    return days;
  };

  // ---------- Módulo de storage ----------

  /**
   * Lê a lista de hábitos do localStorage.
   * Garante sempre um array, normalizando campos principais.
   */
  const getHabitsFromStorage = () => {
    try {
      const raw = window.localStorage.getItem(HABITS_STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((habit, index) => ({
        id: habit.id ?? index,
        nome: habit.nome ?? habit.name ?? 'Hábito sem nome',
        categoria: habit.categoria ?? '',
        criadoEm: habit.criadoEm ?? new Date().toISOString(),
        frequency: habit.frequency ?? habit.frequencia ?? '',
        goal: habit.goal ?? '',
        completedDates: Array.isArray(habit.completedDates)
          ? habit.completedDates
          : [],
      }));
    } catch (error) {
      console.warn('[FitHabit] Erro ao ler hábitos do localStorage:', error);
      return [];
    }
  };

  /**
   * Salva a lista de hábitos no localStorage.
   */
  const saveHabitsToStorage = (habits) => {
    try {
      window.localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
    } catch (error) {
      console.warn('[FitHabit] Erro ao salvar hábitos no localStorage:', error);
    }
  };

  /**
   * Adiciona um novo hábito à lista existente e retorna a lista atualizada.
   */
  const addHabitToStorage = (habit) => {
    const habits = getHabitsFromStorage();
    const newHabit = {
      id: habit.id ?? Date.now(),
      nome: habit.nome,
      categoria: habit.categoria ?? '',
      criadoEm: habit.criadoEm ?? new Date().toISOString(),
      frequency: habit.frequency ?? '',
      goal: habit.goal ?? '',
      completedDates: Array.isArray(habit.completedDates)
        ? habit.completedDates
        : [],
    };

    habits.push(newHabit);
    saveHabitsToStorage(habits);
    return habits;
  };

  /**
   * Marca um hábito como concluído hoje (adiciona a data atual em completedDates).
   * Não duplica a mesma data.
   * Retorna a lista de hábitos atualizada.
   * (Mantido para compatibilidade com possíveis usos externos.)
   */
  const markHabitCompletedToday = (habitId) => {
    const habits = getHabitsFromStorage();
    const idAsString = String(habitId);
    const today = getTodayISODate();

    const updated = habits.map((habit) => {
      if (String(habit.id) !== idAsString) return habit;

      const datesSet = new Set(habit.completedDates ?? []);
      datesSet.add(today);

      return {
        ...habit,
        completedDates: Array.from(datesSet),
      };
    });

    saveHabitsToStorage(updated);
    return updated;
  };

  /**
   * Alterna o status "concluído hoje" de um hábito:
   * - Se a data de hoje estiver em completedDates, remove (NÃO CONCLUÍDO)
   * - Se não estiver, adiciona (CONCLUÍDO)
   * Retorna a lista de hábitos atualizada.
   */
  const toggleHabitTodayCompletion = (habitId) => {
    const habits = getHabitsFromStorage();
    const idAsString = String(habitId);
    const today = getTodayISODate();

    const updated = habits.map((habit) => {
      if (String(habit.id) !== idAsString) return habit;

      const datesSet = new Set(habit.completedDates ?? []);

      if (datesSet.has(today)) {
        // Já concluído hoje: volta para "NÃO CONCLUÍDO"
        datesSet.delete(today);
      } else {
        // Ainda não concluído hoje: marca como "CONCLUÍDO"
        datesSet.add(today);
      }

      return {
        ...habit,
        completedDates: Array.from(datesSet),
      };
    });

    saveHabitsToStorage(updated);
    return updated;
  };

  /**
   * Atualiza os dados principais de um hábito (nome, frequência, objetivo).
   * Mantém campos como completedDates e criadoEm.
   * Retorna a lista de hábitos atualizada.
   */
  const updateHabitInStorage = (habitId, updates) => {
    const habits = getHabitsFromStorage();
    const idAsString = String(habitId);

    const updated = habits.map((habit) => {
      if (String(habit.id) !== idAsString) return habit;

      return {
        ...habit,
        ...updates,
      };
    });

    saveHabitsToStorage(updated);
    return updated;
  };

  /**
   * Remove um hábito definitivamente do storage.
   * Retorna a lista resultante.
   */
  const deleteHabitFromStorage = (habitId) => {
    const habits = getHabitsFromStorage();
    const idAsString = String(habitId);

    const filtered = habits.filter((habit) => String(habit.id) !== idAsString);
    saveHabitsToStorage(filtered);
    return filtered;
  };

  // ---------- Cálculo de progresso ----------

  /**
   * Calcula o progresso dos últimos 7 dias (incluindo hoje),
   * com base nos hábitos cadastrados e suas completedDates.
   *
   * Também calcula:
   * - Média percentual dos últimos 7 dias
   * - Sequência atual de dias seguidos com algum hábito concluído
   *
   * Retorna:
   * - labels: rótulos formatados para o eixo X
   * - data: array de percentuais (0–100)
   * - todayPercent: percentual do dia atual
   * - averagePercent: média dos últimos 7 dias (0–100)
   * - currentStreakDays: número de dias seguidos (a partir de hoje) com percent > 0
   * - totalHabits: quantidade total de hábitos cadastrados
   * - completedTodayCount: quantos hábitos foram concluídos hoje
   */
  const calculateLast7DaysProgress = (habits) => {
    const totalHabits = habits.length;
    const days = getLastNDays(7);

    const labels = [];
    const data = [];
    let completedTodayCount = 0;

    days.forEach(({ iso, label }, index) => {
      labels.push(label);

      if (!totalHabits) {
        data.push(0);
        return;
      }

      const completedCount = habits.filter((habit) =>
        (habit.completedDates || []).includes(iso),
      ).length;

      const percent = (completedCount / totalHabits) * 100;
      data.push(Math.round(percent));

      // Guarda o total de hábitos concluídos especificamente no dia atual
      if (index === days.length - 1) {
        completedTodayCount = completedCount;
      }
    });

    const todayPercent = data[data.length - 1] ?? 0;

    // Média simples dos últimos 7 dias
    const sum = data.reduce((acc, value) => acc + value, 0);
    const averagePercent = data.length ? Math.round(sum / data.length) : 0;

    // Sequência atual de dias seguidos com algum hábito concluído (> 0%)
    let currentStreakDays = 0;
    for (let i = data.length - 1; i >= 0; i -= 1) {
      if (data[i] > 0) {
        currentStreakDays += 1;
      } else {
        break;
      }
    }

    return {
      labels,
      data,
      todayPercent,
      averagePercent,
      currentStreakDays,
      totalHabits,
      completedTodayCount,
    };
  };

  // ---------- Gráfico + barra de progresso ----------

  let habitsProgressChart = null;

  /**
   * Atualiza a barra de "Hábitos Concluídos" no topo do dashboard,
   * mantendo o valor em sincronia com o gráfico.
   */
  const updateDailyProgressUI = (percent) => {
    const clamped = Math.max(0, Math.min(100, Number(percent) || 0));

    const progressBar = document.querySelector('.progress .determinate');
    const progressLabel = document.querySelector('.progress-wrap span.text-sub');

    if (progressBar) {
      progressBar.style.width = `${clamped}%`;
      progressBar.setAttribute('aria-valuenow', String(clamped));
    }

    if (progressLabel) {
      progressLabel.textContent = `${clamped}%`;
    }
  };

  /**
   * Atualiza o resumo diário abaixo da barra "Hábitos Concluídos".
   * Formato:
   * - "Hoje: X de Y hábitos concluídos (Z%)"
   * - ou, se não houver hábitos, "Hoje: nenhum hábito cadastrado ainda"
   */
  const updateTodaySummary = ({
    totalHabits,
    completedTodayCount,
    todayPercent,
  }) => {
    const summaryEl = document.querySelector('[data-habits-today-summary]');
    if (!summaryEl) return;

    if (!totalHabits) {
      summaryEl.textContent = 'Hoje: nenhum hábito cadastrado ainda';
      return;
    }

    const clamped = Math.max(0, Math.min(100, Number(todayPercent) || 0));
    summaryEl.textContent = `Hoje: ${completedTodayCount} de ${totalHabits} hábitos concluídos (${clamped}%)`;
  };

  /**
   * Atualiza os textos do card de resumo dos hábitos no dashboard:
   * - Média dos últimos 7 dias
   * - Sequência atual de dias seguidos cumprindo hábitos
   */
  const updateHabitsSummaryCard = (averagePercent, currentStreakDays) => {
    const averageEl = document.querySelector('[data-habits-average]');
    const streakEl = document.querySelector('[data-habits-streak]');

    if (averageEl) {
      const avg = Number.isFinite(averagePercent) ? Math.max(0, Math.min(100, averagePercent)) : 0;
      averageEl.textContent = `Média: ${avg}% de hábitos concluídos`;
    }

    if (streakEl) {
      const streak = Math.max(0, Number(currentStreakDays) || 0);
      if (streak === 0) {
        streakEl.textContent = 'Sequência atual: nenhum dia seguido cumprindo hábitos ainda';
      } else if (streak === 1) {
        streakEl.textContent = 'Sequência atual: 1 dia seguido cumprindo hábitos';
      } else {
        streakEl.textContent = `Sequência atual: ${streak} dias seguidos cumprindo hábitos`;
      }
    }
  };

  /**
   * Cria ou atualiza o gráfico de progresso dos hábitos no canvas
   * #habitsProgressChart usando Chart.js.
   */
  const renderHabitsProgressChart = () => {
    const canvas = document.getElementById('habitsProgressChart');

    // Mesmo se não houver canvas (por exemplo, na página de hábitos),
    // ainda atualizamos a barra de progresso do topo com base nos hábitos.
    const habits = getHabitsFromStorage();
    const {
      labels,
      data,
      todayPercent,
      averagePercent,
      currentStreakDays,
      totalHabits,
      completedTodayCount,
    } = calculateLast7DaysProgress(habits);

    // Atualiza barra de progresso, resumo diário e card de hábitos
    updateDailyProgressUI(todayPercent);
    updateTodaySummary({ totalHabits, completedTodayCount, todayPercent });
    updateHabitsSummaryCard(averagePercent, currentStreakDays);

    // Se não há canvas ou Chart.js não foi carregado nesta página, apenas retorna.
    if (!canvas || typeof window.Chart === 'undefined') {
      return;
    }

    const rootStyles = getComputedStyle(document.documentElement);
    // Cores lidas das variáveis CSS, permitindo que o gráfico respeite o tema claro/escuro
    const primaryColor = (rootStyles.getPropertyValue('--fh-primary') || '#2DDC9A').trim();
    const subtitleColor = (rootStyles.getPropertyValue('--fh-theme-text-muted') || rootStyles.getPropertyValue('--fh-subtitle') || '#334155').trim();
    const gridColor = (rootStyles.getPropertyValue('--fh-theme-border') || '#E5E7EB').trim();

    if (!habitsProgressChart) {
      // Criação inicial do gráfico
      habitsProgressChart = new window.Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Hábitos concluídos (%)',
              data,
              borderColor: primaryColor,
              backgroundColor: `${primaryColor}33`, // ~20% de opacidade
              tension: 0.25,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: primaryColor,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 0,
              max: 100,
              ticks: {
                stepSize: 20,
                callback: (value) => `${value}%`,
                color: subtitleColor,
              },
              grid: {
                color: gridColor,
              },
            },
            x: {
              ticks: {
                color: subtitleColor,
              },
              grid: {
                display: false,
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.parsed.y}% de hábitos concluídos`,
              },
            },
          },
        },
      });
    } else {
      // Atualização de dados do gráfico existente
      habitsProgressChart.data.labels = labels;
      habitsProgressChart.data.datasets[0].data = data;
      habitsProgressChart.update();
    }
  };

  // ---------- UI da página de hábitos ----------

  /**
   * Renderiza a tabela de hábitos na página "Hábitos".
   */
  const renderHabitsTable = () => {
    const tbody = document.getElementById('habits-tbody');
    if (!tbody) return;

    const habits = getHabitsFromStorage();
    const today = getTodayISODate();

    if (!habits.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="center-align text-sub">Nenhum hábito cadastrado ainda.</td>
        </tr>
      `;
      return;
    }

    const rowsHtml = habits
      .map((habit) => {
        const doneToday = (habit.completedDates || []).includes(today);
        const statusText = doneToday ? 'CONCLUÍDO' : 'NÃO CONCLUÍDO';
        const statusClass = doneToday ? 'fh-status-chip fh-status-done' : 'fh-status-chip fh-status-pending';

        return `
          <tr data-habit-id="${habit.id}">
            <td class="table-cell-wrap">${habit.nome}</td>
            <td class="table-cell-wrap">${habit.frequency || '-'}</td>
            <td class="table-cell-wrap">${habit.goal || '-'}</td>
            <td>
              <button
                type="button"
                class="${statusClass}"
                data-action="toggle-status"
              >
                ${statusText}
              </button>
            </td>
            <td class="right-align fh-actions-col">
              <div class="fh-table-actions">
                <button
                  type="button"
                  class="fh-table-link"
                  data-action="edit-habit"
                >
                  Editar
                </button>
                <button
                  type="button"
                  class="fh-table-link fh-table-link-danger"
                  data-action="delete-habit"
                >
                  Excluir
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.innerHTML = rowsHtml;
  };

  /**
   * Inicializa o formulário de criação de hábito e os eventos da tabela.
   */
  const initHabitsPage = () => {
    const form = document.getElementById('create-habit-form');
    const tbody = document.getElementById('habits-tbody');

    if (!form || !tbody) return; // não estamos na página de hábitos

    // Indicador de edição em andamento (null = criando novo hábito)
    let editingHabitId = null;

    const nameInput = form.querySelector('#name');
    const frequencyInput = form.querySelector('#frequency');
    const goalInput = form.querySelector('#goal');
    const submitButton = form.querySelector('button[type="submit"]');

    // Render inicial da tabela
    renderHabitsTable();

    // Envio do formulário de criação/edição de hábito
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const nome = nameInput.value.trim();
      const frequency = frequencyInput.value.trim();
      const goal = goalInput.value.trim();

      if (!nome) return;

      if (editingHabitId) {
        // Atualiza hábito existente
        updateHabitInStorage(editingHabitId, {
          nome,
          frequency,
          goal,
        });
      } else {
        // Cria o objeto de hábito no formato esperado
        addHabitToStorage({
          nome,
          categoria: '',
          frequency,
          goal,
          completedDates: [],
        });
      }

      // Limpa o formulário, zera modo edição e re-renderiza a lista
      form.reset();
      editingHabitId = null;
      if (submitButton) {
        submitButton.innerHTML = '<i class="material-icons-round left">save</i>SALVAR';
      }

      renderHabitsTable();

      // Recalcula progresso e atualiza gráfico / barra de progresso
      renderHabitsProgressChart();
    });

    // Delegação de eventos na tabela: status, editar e excluir
    tbody.addEventListener('click', (event) => {
      const target = event.target;

      const row = target.closest('tr[data-habit-id]');
      if (!row) return;

      const habitId = row.getAttribute('data-habit-id');
      if (!habitId) return;

      // Toggle de status "CONCLUÍDO" / "NÃO CONCLUÍDO"
      if (target.closest('[data-action="toggle-status"]')) {
        toggleHabitTodayCompletion(habitId);
        renderHabitsTable();
        renderHabitsProgressChart();
        return;
      }

      // Edição de hábito
      if (target.closest('[data-action="edit-habit"]')) {
        const habits = getHabitsFromStorage();
        const habit = habits.find((h) => String(h.id) === String(habitId));
        if (!habit) return;

        nameInput.value = habit.nome || '';
        frequencyInput.value = habit.frequency || '';
        goalInput.value = habit.goal || '';

        editingHabitId = habit.id;

        if (submitButton) {
          submitButton.innerHTML = '<i class="material-icons-round left">save</i>ATUALIZAR';
        }

        // Foca no primeiro campo para reforçar o contexto de edição
        nameInput.focus();
        return;
      }

      // Exclusão de hábito
      if (target.closest('[data-action="delete-habit"]')) {
        const confirmed = window.confirm('Deseja realmente excluir este hábito?');
        if (!confirmed) return;

        deleteHabitFromStorage(habitId);

        // Se estava editando este hábito, cancela o modo edição
        if (editingHabitId && String(editingHabitId) === String(habitId)) {
          form.reset();
          editingHabitId = null;
          if (submitButton) {
            submitButton.innerHTML = '<i class="material-icons-round left">save</i>SALVAR';
          }
        }

        renderHabitsTable();
        renderHabitsProgressChart();
      }
    });
  };

  // ---------- Inicialização global ----------

  document.addEventListener('DOMContentLoaded', () => {
    // Sempre tenta renderizar o gráfico e sincronizar a barra de progresso
    renderHabitsProgressChart();

    // Inicializa comportamento específico da página de hábitos, se presente
    initHabitsPage();
  });

  // ---------- Exposição pública para uso em outros scripts / debugging ----------

  window.FitHabit = {
    getHabitsFromStorage,
    saveHabitsToStorage,
    addHabitToStorage,
    markHabitCompletedToday,
    toggleHabitTodayCompletion,
    updateHabitInStorage,
    deleteHabitFromStorage,
    calculateLast7DaysProgress,
    renderHabitsProgressChart,
  };
})();


