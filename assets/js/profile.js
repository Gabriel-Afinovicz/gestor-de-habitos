// FitHabit - Perfil
// Responsável por:
// - Ler/salvar dados de perfil no localStorage
// - Atualizar avatar (navbar + página de perfil), nome e bio
// - Controlar o modal de edição de perfil (Materialize)

(() => {
  const PROFILE_STORAGE_KEY = 'fitHabitProfile';

  const defaultProfile = {
    name: 'Sofia Oliveira',
    bio: 'Entusiasta de fitness e bem-estar',
    photoDataUrl: null,
  };

  /**
   * Lê o perfil do localStorage ou retorna um objeto padrão.
   */
  const getProfileFromStorage = () => {
    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) return { ...defaultProfile };
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name || defaultProfile.name,
        bio: parsed.bio || defaultProfile.bio,
        photoDataUrl: typeof parsed.photoDataUrl === 'string' ? parsed.photoDataUrl : null,
      };
    } catch (error) {
      console.warn('[FitHabitProfile] Erro ao ler perfil do localStorage:', error);
      return { ...defaultProfile };
    }
  };

  /**
   * Salva o perfil no localStorage.
   */
  const saveProfileToStorage = (profile) => {
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.warn('[FitHabitProfile] Erro ao salvar perfil no localStorage:', error);
    }
  };

  /**
   * Aplica os dados de perfil no DOM:
   * - Nome e bio (página de perfil)
   * - Avatares (navbar + perfil)
   */
  const applyProfileToDOM = (profile) => {
    const { name, bio, photoDataUrl } = profile;

    // Nome e bio na página de perfil
    const nameEl = document.querySelector('[data-profile-name]');
    if (nameEl) nameEl.textContent = name;

    const bioEl = document.querySelector('[data-profile-bio]');
    if (bioEl) bioEl.textContent = bio;

    // Avatares (navbar + perfil) — qualquer elemento que tenha data-profile-avatar
    document.querySelectorAll('[data-profile-avatar]').forEach((avatarEl) => {
      const iconEl = avatarEl.querySelector('.profile-avatar-icon');

      if (photoDataUrl) {
        avatarEl.classList.add('has-photo');
        avatarEl.style.backgroundImage = `url(${photoDataUrl})`;
        avatarEl.style.backgroundSize = 'cover';
        avatarEl.style.backgroundPosition = 'center';
        if (iconEl) iconEl.style.display = 'none';
      } else {
        avatarEl.classList.remove('has-photo');
        avatarEl.style.backgroundImage = 'none';
        if (iconEl) iconEl.style.display = 'flex';
      }
    });
  };

  /**
   * Carrega o perfil do storage e aplica no DOM.
   * Exposta como função global para ser reutilizada em qualquer página.
   */
  const loadProfileFromStorage = () => {
    const profile = getProfileFromStorage();
    applyProfileToDOM(profile);
    return profile;
  };

  /**
   * Inicializa o modal de edição de perfil (apenas na página de perfil).
   */
  const initProfileModal = (profile) => {
    const modalEl = document.getElementById('editProfileModal');
    const form = document.getElementById('editProfileForm');
    if (!modalEl || !form) return;

    // Inicializa modal do Materialize (se disponível)
    let modalInstance = null;
    if (window.M && M.Modal) {
      modalInstance = M.Modal.init(modalEl, {});
    }

    const nameInput = form.querySelector('#profileName');
    const bioInput = form.querySelector('#profileBio');
    const photoInput = form.querySelector('#profilePhotoInput');

    // Campos de endereço (API ViaCEP)
    const cepInput = form.querySelector('#profileCep');
    const logradouroInput = form.querySelector('#profileLogradouro');
    const bairroInput = form.querySelector('#profileBairro');
    const cidadeInput = form.querySelector('#profileCidade');
    const ufInput = form.querySelector('#profileUf');
    const cepErrorEl = document.getElementById('cep-error');

    const CEP_REGEX = /^[0-9]{5}-?[0-9]{3}$/;

    const clearAddressFields = () => {
      if (logradouroInput) logradouroInput.value = '';
      if (bairroInput) bairroInput.value = '';
      if (cidadeInput) cidadeInput.value = '';
      if (ufInput) ufInput.value = '';
    };

    const showCepError = (message) => {
      if (!cepErrorEl) return;
      cepErrorEl.textContent = message;
      cepErrorEl.classList.remove('is-hidden');
    };

    const clearCepError = () => {
      if (!cepErrorEl) return;
      cepErrorEl.textContent = '';
      cepErrorEl.classList.add('is-hidden');
    };

    const buscarCep = async () => {
      if (!cepInput) return;
      const rawCep = (cepInput.value || '').trim();

      // Validação com REGEX (ID 12)
      if (!CEP_REGEX.test(rawCep)) {
        clearAddressFields();
        showCepError('CEP inválido. Verifique e tente novamente.');
        return;
      }

      clearCepError();

      const cepSomenteNumeros = rawCep.replace(/\D/g, '');

      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cepSomenteNumeros}/json/`);
        if (!resp.ok) throw new Error('Erro na requisição');

        const data = await resp.json();
        if (data.erro) throw new Error('CEP não encontrado');

        if (logradouroInput) logradouroInput.value = data.logradouro || '';
        if (bairroInput) bairroInput.value = data.bairro || '';
        if (cidadeInput) cidadeInput.value = data.localidade || '';
        if (ufInput) ufInput.value = data.uf || '';

        if (window.M && M.updateTextFields) {
          M.updateTextFields();
        }

        // Busca bem-sucedida: remove qualquer mensagem de erro prévia
        clearCepError();
      } catch (error) {
        clearAddressFields();
        console.error('[FitHabitProfile] Erro ao buscar CEP:', error);
        if (error && error.message === 'CEP não encontrado') {
          showCepError('CEP não encontrado. Tente outro CEP.');
        } else {
          showCepError('Não foi possível buscar o CEP. Tente novamente.');
        }
      }
    };

    // Preenche campos com os valores atuais
    if (nameInput) nameInput.value = profile.name || '';
    if (bioInput) bioInput.value = profile.bio || '';

    // Atualiza labels do Materialize
    if (window.M && M.updateTextFields) {
      M.updateTextFields();
    }

    // Eventos para busca de CEP (API pública ViaCEP)
    const cepButton = form.querySelector('#btnBuscarCep');
    if (cepButton && cepInput) {
      cepButton.addEventListener('click', (event) => {
        event.preventDefault();
        buscarCep();
      });
    }

    if (cepInput) {
      cepInput.addEventListener('blur', () => {
        if (cepInput.value.trim().length >= 9) {
          buscarCep();
        }
      });
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const newName = nameInput.value.trim();
      const newBio = bioInput.value.trim();

      if (!newName || !newBio) {
        if (window.M && M.toast) {
          M.toast({ text: 'Preencha nome e descrição.', classes: 'rounded' });
        }
        return;
      }

      const file = photoInput.files[0];

      const saveAndClose = (photoDataUrl) => {
        const updatedProfile = {
          name: newName,
          bio: newBio,
          photoDataUrl: typeof photoDataUrl === 'string' ? photoDataUrl : profile.photoDataUrl,
        };

        saveProfileToStorage(updatedProfile);
        // Reaplica o perfil em TODOS os lugares (navbar + cartão)
        loadProfileFromStorage();

        if (modalInstance) modalInstance.close();
        if (window.M && M.toast) {
          M.toast({ text: 'Perfil atualizado com sucesso.', classes: 'rounded' });
        }
      };

      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          saveAndClose(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        saveAndClose(undefined);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    const profile = loadProfileFromStorage();

    // Inicializa modal somente na aba de Perfil
    initProfileModal(profile);
  });

  // API pública opcional para debugging
  window.FitHabitProfile = {
    getProfileFromStorage,
    saveProfileToStorage,
    applyProfileToDOM,
    loadProfileFromStorage,
  };
})();


