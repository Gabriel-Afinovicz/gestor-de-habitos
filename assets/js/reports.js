// FitHabit - Relatórios
// Responsável por:
// - Gerar o calendário de relatórios dinamicamente
// - Permitir seleção de intervalo (dataInicial/dataFinal) diretamente nos dias
// - Filtrar os dados de hábitos por intervalo e atualizar o gráfico (Chart.js)

(() => {
  const DAYS_BACK_DEFAULT = 60; // janela padrão para gerar dados históricos

  let calendarData = []; // [{ iso, date, label, weekday, percent }]
  let selectedStart = null; // ISO string YYYY-MM-DD
  let selectedEnd = null;   // ISO string YYYY-MM-DD
  let reportsChart = null;  // instância do gráfico Chart.js

  /**
   * Cria um objeto Date a partir de uma string ISO (YYYY-MM-DD).
   */
  const parseISODate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  /**
   * Converte uma data ISO (YYYY-MM-DD) para exibição como dd/MM/yyyy.
   */
  const isoToDisplayDate = (iso) => {
    if (!iso) return '';
    const d = parseISODate(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  /**
   * Converte uma data no formato dd/MM/yyyy para ISO (YYYY-MM-DD).
   * Retorna string vazia se o formato não for válido.
   */
  const displayDateToISO = (value) => {
    if (!value) return '';
    const parts = value.split('/');
    if (parts.length !== 3) return '';

    const [dayStr, monthStr, yearStr] = parts;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);

    if (!day || !month || !year) return '';

    const d = new Date(year, month - 1, day);

    // Validação simples para evitar datas inválidas (ex.: 31/02)
    if (
      d.getFullYear() !== year ||
      d.getMonth() !== month - 1 ||
      d.getDate() !== day
    ) {
      return '';
    }

    return d.toISOString().slice(0, 10);
  };

  /**
   * Aplica máscara de data dd/mm/aaaa a um valor qualquer,
   * mantendo apenas os dígitos e inserindo as barras automaticamente.
   */
  const formatDateMaskValue = (rawValue) => {
    if (!rawValue) return '';
    const digits = rawValue.replace(/\D/g, '').slice(0, 8); // ddmmAAAA

    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  /**
   * Anexa comportamentos de máscara de data (input + paste) a um campo.
   */
  const attachDateMask = (input) => {
    if (!input) return;

    input.setAttribute('maxlength', '10');

    input.addEventListener('input', () => {
      const formatted = formatDateMaskValue(input.value);
      input.value = formatted;
    });

    input.addEventListener('paste', (event) => {
      event.preventDefault();
      const clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const text = clipboardData.getData('text') || '';
      input.value = formatDateMaskValue(text);
    });
  };
  /**
   * Formata uma data ISO em dd/MM.
   */
  const formatLabel = (iso) => {
    const d = parseISODate(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  /**
   * Formata uma data ISO em dd/MM/yyyy para o texto explicativo acima do gráfico.
   */
  const formatFullLabel = (iso) => {
    const d = parseISODate(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  /**
   * Gera os dados de progresso diário dos hábitos para os últimos N dias.
   * Usa a mesma estrutura de hábitos que o módulo principal (FitHabit) já utiliza.
   *
   * Cada entrada contém:
   * - iso: data no formato YYYY-MM-DD
   * - date: objeto Date
   * - label: dd/MM
   * - weekday: rótulo curto do dia da semana
   * - percent: percentual de hábitos concluídos (0–100)
   */
  const buildDailyProgress = (habits, daysBack) => {
    const totalHabits = habits.length;
    const result = [];
    const today = new Date();
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = daysBack - 1; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);

      let percent = 0;
      if (totalHabits > 0) {
        const completedCount = habits.filter((habit) =>
          (habit.completedDates || []).includes(iso),
        ).length;
        percent = Math.round((completedCount / totalHabits) * 100);
      }

      result.push({
        iso,
        date: d,
        label: formatLabel(iso),
        weekday: weekDays[d.getDay()],
        percent,
      });
    }

    return result;
  };

  /**
   * Gera o calendário de relatórios dentro do container #reports-calendar.
   * O calendário é gerado em DOIS blocos (meses) lado a lado, cada um
   * contendo apenas os dias daquele mês específico.
   *
   * Cada célula de dia recebe data-iso para permitir a seleção via clique.
   */
  const renderCalendar = () => {
    const container = document.getElementById('reports-calendar');
    if (!container || !calendarData.length) return;

    container.innerHTML = '';

    // Agrupa os dias por mês/ano, preservando a ordem
    const monthsMap = new Map(); // key: "YYYY-MM" -> [entries]
    calendarData.forEach((entry) => {
      const year = entry.date.getFullYear();
      const month = String(entry.date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      if (!monthsMap.has(key)) {
        monthsMap.set(key, []);
      }
      monthsMap.get(key).push(entry);
    });

    const allMonthKeys = Array.from(monthsMap.keys()).sort();
    // Exibimos apenas os dois últimos meses com dados
    const visibleMonthKeys = allMonthKeys.slice(-2);

    const wrapper = document.createElement('div');
    wrapper.className = 'reports-cal-wrapper';

    const weekDayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    });

    visibleMonthKeys.forEach((key) => {
      const entries = monthsMap.get(key);
      if (!entries || !entries.length) return;

      const monthBlock = document.createElement('div');
      monthBlock.className = 'calendar-month';

      // Obtém ano/mês diretamente da chave "YYYY-MM"
      const [yearStr, monthStr] = key.split('-');
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1; // 0 = janeiro

      // Título do mês (ex.: "outubro de 2025")
      const anyDate = new Date(year, monthIndex, 1);
      const monthHeader = document.createElement('div');
      monthHeader.className = 'cal-month';
      monthHeader.textContent = monthFormatter.format(anyDate);
      monthBlock.appendChild(monthHeader);

      const grid = document.createElement('div');
      grid.className = 'cal-grid';

      // Cabeçalho de dias da semana
      weekDayLabels.forEach((label) => {
        const head = document.createElement('div');
        head.className = 'cal-head';
        head.textContent = label;
        grid.appendChild(head);
      });

      // Mapa auxiliar para saber quais dias têm dados de hábitos
      const entriesByIso = new Map(
        entries.map((entry) => [entry.iso, entry]),
      );

      const firstWeekday = new Date(year, monthIndex, 1).getDay(); // 0=Dom..6=Sáb
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

      const today = new Date();
      const todayIso = today.toISOString().slice(0, 10);
      const isCurrentMonth =
        year === today.getFullYear() && monthIndex === today.getMonth();

      // Células vazias antes do dia 1 para alinhar corretamente na semana
      for (let i = 0; i < firstWeekday; i += 1) {
        const empty = document.createElement('div');
        empty.className = 'cal-empty';
        grid.appendChild(empty);
      }

      // Dias reais do mês, posicionados conforme o dia da semana
      for (let day = 1; day <= daysInMonth; day += 1) {
        const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = entriesByIso.get(iso);

        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cal-cell';
        cell.textContent = day;

        const isFutureDay = isCurrentMonth && iso > todayIso;

        if (isFutureDay) {
          // Dias futuros do mês atual → apagados e desativados
          cell.classList.add('cal-future');
          cell.setAttribute('aria-disabled', 'true');
        } else {
          // Dia clicável (mesmo que ainda não tenha dados de hábitos)
          cell.dataset.iso = iso;

          const label = entry ? entry.label : formatLabel(iso);
          const percent = entry ? entry.percent : 0;

          cell.setAttribute(
            'aria-label',
            `Dia ${label} - ${percent}% de hábitos concluídos`,
          );
        }

        grid.appendChild(cell);
      }

      // Células vazias após o último dia para completar a última linha (opcional, mas deixa o grid simétrico)
      const totalCells = firstWeekday + daysInMonth;
      const remainder = totalCells % 7;
      if (remainder !== 0) {
        for (let i = 0; i < 7 - remainder; i += 1) {
          const empty = document.createElement('div');
          empty.className = 'cal-empty';
          grid.appendChild(empty);
        }
      }

      monthBlock.appendChild(grid);
      wrapper.appendChild(monthBlock);
    });

    container.appendChild(wrapper);

    // Reaplica estilos de seleção (range) após recriar o DOM
    updateCalendarSelectionStyles();
  };

  /**
   * Atualiza as classes CSS das células do calendário com base em selectedStart/selectedEnd.
   * - dataInicial e dataFinal recebem estilos de borda/bolha
   * - dias intermediários recebem um fundo suave
   */
  const updateCalendarSelectionStyles = () => {
    const cells = document.querySelectorAll('#reports-calendar .cal-cell');
    cells.forEach((cell) => {
      cell.classList.remove('cal-range-start', 'cal-range-end', 'cal-range-between');
    });

    if (!selectedStart) return;

    const start = selectedStart;
    const end = selectedEnd || selectedStart;

    cells.forEach((cell) => {
      const iso = cell.dataset.iso;
      if (!iso) return;

      if (iso === start) {
        cell.classList.add('cal-range-start');
      }
      if (iso === end) {
        cell.classList.add('cal-range-end');
      }
      if (iso > start && iso < end) {
        cell.classList.add('cal-range-between');
      }
    });
  };

  /**
   * Lida com o clique em um dia do calendário, implementando a lógica:
   * - 1º clique: define dataInicial
   * - 2º clique: define dataFinal (ajusta ordem se necessário)
   * - 3º clique: começa novo intervalo a partir do dia clicado
   */
  const handleDayClick = (iso) => {
    if (!selectedStart && !selectedEnd) {
      // Primeiro clique: define dataInicial
      selectedStart = iso;
      selectedEnd = null;
    } else if (selectedStart && !selectedEnd) {
      // Segundo clique: define dataFinal, garantindo que start <= end
      if (iso === selectedStart) {
        selectedEnd = iso;
      } else if (iso > selectedStart) {
        selectedEnd = iso;
      } else {
        selectedEnd = selectedStart;
        selectedStart = iso;
      }
    } else {
      // Terceiro clique: reinicia intervalo a partir do novo dia
      selectedStart = iso;
      selectedEnd = null;
    }

    updateCalendarSelectionStyles();

    // Se intervalo completo, atualiza o gráfico com o novo range
    if (selectedStart && selectedEnd) {
      updateReportsChartForRange(selectedStart, selectedEnd);
    } else {
      // Sem intervalo completo → volta ao padrão (últimos 30 dias)
      updateReportsChartDefault();
    }
  };

  /**
   * Inicializa os controles de intervalo por data no layout mobile
   * (inputs de texto com máscara + botão "Aplicar período"), reutilizando a
   * mesma lógica de atualização de gráfico usada pelo calendário.
   */
  const initMobileDateRangeControls = () => {
    const container = document.querySelector('.date-range-mobile');
    if (!container) return;

    const startInput = container.querySelector('#data-inicial');
    const endInput = container.querySelector('#data-final');
    const applyButton = container.querySelector('.btn-filtrar-periodo');

    if (!startInput || !endInput || !applyButton) return;

    // Pré-preenche com o mesmo intervalo padrão usado no gráfico (últimos 30 dias)
    if (calendarData.length >= 1) {
      const points = calendarData.slice(-30);
      const first = points[0];
      const last = points[points.length - 1];
      if (first && last) {
        startInput.value = isoToDisplayDate(first.iso);
        endInput.value = isoToDisplayDate(last.iso);
      }
    }

    // Aplica máscara de data dd/mm/aaaa a todos os campos de data do card mobile
    const maskedInputs = container.querySelectorAll('.date-mask');
    maskedInputs.forEach((input) => attachDateMask(input));

    applyButton.addEventListener('click', () => {
      const startIso = displayDateToISO(startInput.value);
      const endIso = displayDateToISO(endInput.value);

      // Só aplica se as duas datas estiverem preenchidas
      if (!startIso || !endIso) {
        return;
      }

      // Garante que dataInicial <= dataFinal
      if (startIso > endIso) {
        return;
      }

      selectedStart = startIso;
      selectedEnd = endIso;

      // Atualiza destaque visual no calendário (útil ao alternar para desktop)
      updateCalendarSelectionStyles();

      // Reaproveita a mesma função de atualização do gráfico do calendário
      updateReportsChartForRange(startIso, endIso);
    });
  };

  /**
   * Inicializa listeners de clique nas células do calendário (event delegation).
   */
  const initCalendarInteractions = () => {
    const container = document.getElementById('reports-calendar');
    if (!container) return;

    container.addEventListener('click', (event) => {
      const cell = event.target.closest('.cal-cell');
      if (!cell) return;
      const iso = cell.dataset.iso;
      if (!iso) return;
      handleDayClick(iso);
    });
  };

  /**
   * Renderiza ou atualiza o gráfico de relatórios usando Chart.js.
   * Recebe:
   * - points: array de { iso, percent }
   * - rangeText: texto explicando o período exibido
   */
  const renderReportsChart = (points, rangeText) => {
    const canvas = document.getElementById('reportsChart');
    if (!canvas || typeof window.Chart === 'undefined') return;

    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = (rootStyles.getPropertyValue('--fh-primary') || '#2DDC9A').trim();
    const subtitleColor = (rootStyles.getPropertyValue('--fh-theme-text-muted') || '#64748B').trim();
    const gridColor = (rootStyles.getPropertyValue('--fh-theme-border') || '#E5E7EB').trim();

    const labels = points.map((p) => formatLabel(p.iso));
    const data = points.map((p) => p.percent);

    const rangeEl = document.querySelector('[data-reports-range]');
    if (rangeEl) {
      rangeEl.textContent = rangeText;
    }

    if (!reportsChart) {
      // Criação inicial do gráfico
      reportsChart = new window.Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Hábitos concluídos (%)',
              data,
              borderColor: primaryColor,
              backgroundColor: `${primaryColor}33`,
              tension: 0.25,
              fill: true,
              pointRadius: 3,
              pointHoverRadius: 5,
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
                maxRotation: 0,
              },
              grid: {
                display: false,
              },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.parsed.y}% de hábitos concluídos`,
              },
            },
          },
        },
      });
    } else {
      // Atualização do gráfico existente
      reportsChart.data.labels = labels;
      reportsChart.data.datasets[0].data = data;
      reportsChart.update();
    }
  };

  /**
   * Atualiza o gráfico para o intervalo selecionado (dataInicial, dataFinal).
   * Filtra calendarData para incluir apenas os dias dentro do intervalo [startIso, endIso].
   */
  const updateReportsChartForRange = (startIso, endIso) => {
    if (!calendarData.length) return;

    const points = calendarData.filter((p) => p.iso >= startIso && p.iso <= endIso);
    if (!points.length) {
      renderReportsChart([], 'Sem dados para o intervalo selecionado');
      return;
    }

    const rangeText = `Exibindo de ${formatFullLabel(startIso)} a ${formatFullLabel(endIso)}`;
    renderReportsChart(points, rangeText);
  };

  /**
   * Atualiza o gráfico para o padrão (sem intervalo selecionado):
   * últimos 30 dias da janela calendarData.
   */
  const updateReportsChartDefault = () => {
    if (!calendarData.length) return;

    const points = calendarData.slice(-30);
    const first = points[0];
    const last = points[points.length - 1];

    const rangeText = `Exibindo de ${formatFullLabel(first.iso)} a ${formatFullLabel(last.iso)}`;
    renderReportsChart(points, rangeText);
  };

  /**
   * Inicialização da aba de relatórios:
   * - Lê hábitos via módulo principal (FitHabit)
   * - Gera dados diários para os últimos DAYS_BACK_DEFAULT dias
   * - Renderiza calendário e gráfico padrão
   * - Configura interação de seleção de intervalo
   */
  const initReportsPage = () => {
    if (!document.getElementById('reports-calendar')) return;

    if (!window.FitHabit || typeof window.FitHabit.getHabitsFromStorage !== 'function') {
      console.warn('[FitHabitReports] Módulo FitHabit não encontrado; abortando relatórios.');
      return;
    }

    const habits = window.FitHabit.getHabitsFromStorage();
    calendarData = buildDailyProgress(habits, DAYS_BACK_DEFAULT);

    renderCalendar();
    initCalendarInteractions();
    updateCalendarSelectionStyles();
    updateReportsChartDefault();
    initMobileDateRangeControls();
  };

  document.addEventListener('DOMContentLoaded', initReportsPage);
})();


