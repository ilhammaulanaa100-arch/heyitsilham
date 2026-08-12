/* Shared menu email copy interaction and accessible success/error feedback. */
(function () {
  'use strict';

  var hideTimers = new WeakMap();

  function fallbackCopy(value) {
    return new Promise(function (resolve, reject) {
      var textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        if (!document.execCommand('copy')) throw new Error('Copy command failed');
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        textarea.remove();
      }
    });
  }

  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value);
    }
    return fallbackCopy(value);
  }

  function showToast(toast, state, message) {
    var previousTimer = hideTimers.get(toast);
    if (previousTimer) window.clearTimeout(previousTimer);

    toast.textContent = message;
    toast.classList.remove('is-success', 'is-error', 'is-visible');
    toast.classList.add(state === 'success' ? 'is-success' : 'is-error');
    void toast.offsetWidth;
    toast.classList.add('is-visible');

    hideTimers.set(toast, window.setTimeout(function () {
      toast.classList.remove('is-visible');
      hideTimers.delete(toast);
    }, 2800));
  }

  document.querySelectorAll('[data-copy-email]').forEach(function (button) {
    var menu = button.closest('.site-menu');
    var toast = menu && menu.querySelector('.site-menu-toast');
    if (!toast) return;

    button.addEventListener('click', function () {
      var email = button.getAttribute('data-copy-email');
      copyText(email).then(function () {
        showToast(toast, 'success', 'Email copied to clipboard');
        if (window.PortoAnalytics) {
          PortoAnalytics.track('contact_intent', { method: 'copy-email' }, { once: 'contact:copy-email' });
        }
      }).catch(function () {
        showToast(toast, 'error', 'Couldn’t copy email');
      });
    });
  });
})();
