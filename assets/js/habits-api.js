// FitHabit - API fake de Hábitos (JSON Server)
// Uso:
//   - Executar: npm run api
//   - Endpoints: http://localhost:3000/habitos
// Fornece helpers simples para GET / POST / PUT usando fetch.

(() => {
  // URL fixa da API fake (JSON Server). Certifique-se de rodar: npm run api
  const HABITS_API_URL = 'http://localhost:3000/habitos';

  const handleResponse = async (response) => {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro na API fake: ${response.status} ${text}`);
    }
    return response.json();
  };

  const getHabitos = async () => {
    try {
      const resp = await fetch(HABITS_API_URL, { method: 'GET' });
      return await handleResponse(resp);
    } catch (error) {
      console.error('[FitHabitApi] Erro ao buscar hábitos na API fake:', error);
      return null;
    }
  };

  const createHabito = async (dados) => {
    try {
      const resp = await fetch(HABITS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      return await handleResponse(resp);
    } catch (error) {
      console.error('[FitHabitApi] Erro ao criar hábito na API fake:', error);
      return null;
    }
  };

  const updateHabito = async (id, dados) => {
    try {
      const resp = await fetch(`${HABITS_API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      return await handleResponse(resp);
    } catch (error) {
      console.error('[FitHabitApi] Erro ao atualizar hábito na API fake:', error);
      return null;
    }
  };

  /**
   * Atualiza apenas o campo "status" de um hábito na API fake.
   * novoStatus deve ser "CONCLUIDO" ou "NAO_CONCLUIDO".
   */
  const updateHabitStatus = async (id, novoStatus) => {
    try {
      const resp = await fetch(`${HABITS_API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      return await handleResponse(resp);
    } catch (error) {
      console.error('[FitHabitApi] Erro ao atualizar status do hábito na API fake:', error);
      return null;
    }
  };

  /**
   * Remove definitivamente um hábito na API fake.
   */
  const deleteHabit = async (id) => {
    try {
      const resp = await fetch(`${HABITS_API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!resp.ok) {
        throw new Error(`Erro na API fake: ${resp.status}`);
      }
      return true;
    } catch (error) {
      console.error('[FitHabitApi] Erro ao excluir hábito na API fake:', error);
      return false;
    }
  };

  // Expõe helpers em um namespace global simples.
  window.FitHabitApi = {
    getHabitos,
    createHabito,
    updateHabito,
    updateHabitStatus,
    deleteHabit,
  };
})();


