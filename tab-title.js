(function () {
  'use strict';

  var awayTitle = "Let's collaborate! Message me.";
  var pageTitle = document.title;
  var titleEl = document.querySelector('title');

  if (titleEl && window.MutationObserver) {
    new MutationObserver(function () {
      if (!document.hidden && document.title !== awayTitle) pageTitle = document.title;
    }).observe(titleEl, { childList: true, characterData: true, subtree: true });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      pageTitle = document.title;
      document.title = awayTitle;
    } else {
      document.title = pageTitle;
    }
  });
})();
