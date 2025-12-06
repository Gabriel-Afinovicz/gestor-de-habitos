// FitHabit - extensões com jQuery para a página de Perfil
// - Aplica máscara de CEP usando jQuery Mask Plugin.
// - Adiciona um pequeno feedback visual ao salvar o perfil.

$(function () {
  const $cep = $('#profileCep');
  const $form = $('#editProfileForm');
  const $profileCard = $('.profile-card');

  // Máscara de CEP (00000-000) usando jQuery Mask Plugin
  if ($cep.length && $.fn.mask) {
    $cep.mask('00000-000');
  }

  // Feedback visual simples ao enviar o formulário de perfil
  if ($form.length && $profileCard.length) {
    $form.on('submit', function () {
      $profileCard.addClass('profile-card--updating');
      setTimeout(() => {
        $profileCard.removeClass('profile-card--updating');
      }, 600);
    });
  }
});


