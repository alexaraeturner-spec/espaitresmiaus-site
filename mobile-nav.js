/**
 * Espai Tres Miaus — Mobile nav toggle
 * Injects a hamburger button into the existing <nav> and toggles
 * the .nav-links menu open/closed on small screens. Works with the
 * same <nav><div class="nav-logo">...</div><ul class="nav-links">...</ul></nav>
 * markup already used on every page — no HTML edits needed per page.
 */
(function () {
  function init() {
    var nav = document.querySelector('nav');
    var links = nav ? nav.querySelector('.nav-links') : null;
    if (!nav || !links) return;

    var btn = document.createElement('button');
    btn.className = 'tm-nav-toggle';
    btn.setAttribute('aria-label', 'Toggle menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(btn);

    btn.addEventListener('click', function () {
      nav.classList.toggle('tm-nav-open');
    });

    // Close menu when a link is tapped
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') nav.classList.remove('tm-nav-open');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
