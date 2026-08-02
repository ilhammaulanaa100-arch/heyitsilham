// Shared per-letter hover motion for the Menu trigger and List/Grid switch.
(function () {
  'use strict';

  var canHover = window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!canHover || reducedMotion || !Element.prototype.animate) return;

  document.querySelectorAll('.menu-button').forEach(function (button) {
    var label = button.querySelector('.menu-button-label-menu');
    var icon = button.querySelector('.menu-button-icon');
    if (!label || label.querySelector('.menu-button-letter')) return;

    var text = label.textContent.trim();
    var letters = [];
    var activeAnimations = [];

    label.textContent = '';
    label.setAttribute('aria-hidden', 'true');

    Array.from(text).forEach(function (character) {
      var letter = document.createElement('span');
      letter.className = 'menu-button-letter';
      letter.textContent = character;
      label.appendChild(letter);
      letters.push(letter);
    });

    function cancelActiveAnimations() {
      activeAnimations.forEach(function (animation) { animation.cancel(); });
      activeAnimations = [];
    }

    function animateWobble(target, rotation, scale, delay, animateWeight) {
      var distorted = 'rotate(' + rotation.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
      var restStart = {
        transform: 'rotate(0deg) scale(1)',
        offset: 0,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      };
      var distortedIn = {
        transform: distorted,
        offset: 0.3846,
        easing: 'linear'
      };
      var distortedOut = {
        transform: distorted,
        offset: 0.6154,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      };
      var restEnd = {
        transform: 'rotate(0deg) scale(1)',
        offset: 1
      };

      if (animateWeight) {
        restStart.fontWeight = '400';
        distortedIn.fontWeight = '600';
        distortedOut.fontWeight = '600';
        restEnd.fontWeight = '400';
      }

      var animation = target.animate([
        restStart,
        distortedIn,
        distortedOut,
        restEnd
      ], {
        duration: 650,
        delay: delay,
        fill: 'none'
      });

      activeAnimations.push(animation);
    }

    function playLetterHover() {
      if (button.getAttribute('aria-expanded') === 'true') return;

      cancelActiveAnimations();
      if (icon) {
        animateWobble(
          icon,
          -12 + Math.random() * 24,
          1.14 + Math.random() * 0.16,
          0,
          false
        );
      }
      letters.forEach(function (letter, index) {
        var rotation = -15 + Math.random() * 30;
        var scale = 1.15 + Math.random() * 0.25;
        animateWobble(letter, rotation, scale, index * 50, true);
      });
    }

    button.addEventListener('mouseenter', playLetterHover);
    button.addEventListener('click', cancelActiveAnimations);
  });

  document.querySelectorAll('.view-tabs').forEach(function (button) {
    var states = Array.from(button.querySelectorAll('.view-switch-state')).map(function (state) {
      var label = state.querySelector('.view-switch-label');
      var icon = state.querySelector('.view-switch-icon');
      var letters = [];

      if (!label || label.querySelector('.view-switch-letter')) {
        return { state: state, icon: icon, letters: letters };
      }

      var text = label.textContent.trim();
      label.textContent = '';

      Array.from(text).forEach(function (character) {
        var letter = document.createElement('span');
        letter.className = 'view-switch-letter';
        letter.textContent = character;
        label.appendChild(letter);
        letters.push(letter);
      });

      return { state: state, icon: icon, letters: letters };
    });
    var activeAnimations = [];

    function cancelActiveAnimations() {
      activeAnimations.forEach(function (animation) { animation.cancel(); });
      activeAnimations = [];
    }

    function animateWobble(target, rotation, scale, delay, animateWeight) {
      if (!target) return;

      var distorted = 'rotate(' + rotation.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
      var restStart = {
        transform: 'rotate(0deg) scale(1)',
        offset: 0,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      };
      var distortedIn = {
        transform: distorted,
        offset: 0.3846,
        easing: 'linear'
      };
      var distortedOut = {
        transform: distorted,
        offset: 0.6154,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      };
      var restEnd = {
        transform: 'rotate(0deg) scale(1)',
        offset: 1
      };

      if (animateWeight) {
        restStart.fontWeight = '400';
        distortedIn.fontWeight = '600';
        distortedOut.fontWeight = '600';
        restEnd.fontWeight = '400';
      }

      activeAnimations.push(target.animate([
        restStart,
        distortedIn,
        distortedOut,
        restEnd
      ], {
        duration: 650,
        delay: delay,
        fill: 'none'
      }));
    }

    function playViewHover() {
      cancelActiveAnimations();

      var activeState = states.find(function (item) {
        return button.classList.contains('is-grid')
          ? item.state.classList.contains('view-switch-state-grid')
          : item.state.classList.contains('view-switch-state-list');
      });
      if (!activeState) return;

      animateWobble(
        activeState.icon,
        -12 + Math.random() * 24,
        1.14 + Math.random() * 0.16,
        0,
        false
      );
      activeState.letters.forEach(function (letter, index) {
        animateWobble(
          letter,
          -15 + Math.random() * 30,
          1.15 + Math.random() * 0.25,
          index * 50,
          true
        );
      });
    }

    button.addEventListener('mouseenter', playViewHover);
    button.addEventListener('click', cancelActiveAnimations);
  });
})();
