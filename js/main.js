document.documentElement.classList.add('js-ready');

// Reveal-on-scroll
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.08 });
revealEls.forEach(el => io.observe(el));

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navRight = document.getElementById('navRight');
if (navToggle && navRight) {
  navToggle.addEventListener('click', () => {
    const isOpen = navRight.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  navRight.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navRight.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Ticker pause/play
const tickerTrack = document.getElementById('tickerTrack');
const tickerPause = document.getElementById('tickerPause');
if (tickerTrack && tickerPause) {
  tickerPause.addEventListener('click', () => {
    const isPaused = tickerTrack.classList.toggle('paused');
    tickerPause.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
    tickerPause.setAttribute('aria-label', isPaused ? 'Play scrolling ticker' : 'Pause scrolling ticker');
    tickerPause.textContent = isPaused ? '►' : '❚❚';
  });
}

// Count-up for stat figures with data-count-to
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const countEls = document.querySelectorAll('[data-count-to]');
if (countEls.length) {
  const countIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      countIo.unobserve(el);
      const target = parseInt(el.getAttribute('data-count-to'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion || !target) {
        el.textContent = target.toLocaleString() + suffix;
        return;
      }
      const duration = 1200;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased).toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });
  countEls.forEach(el => countIo.observe(el));
}

// Contact form -> mailto (no backend configured yet)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const name = (data.get('name') || '').toString();
    const org = (data.get('organization') || '').toString();
    const email = (data.get('email') || '').toString();
    const interest = (data.get('interest') || '').toString();
    const message = (data.get('message') || '').toString();
    const subject = `Website inquiry: ${interest || 'General'} — ${name}`;
    const bodyLines = [
      `Name: ${name}`,
      org ? `Organization: ${org}` : null,
      `Email: ${email}`,
      `Interest: ${interest}`,
      '',
      message
    ].filter(Boolean);
    const mailto = `mailto:osamaalzedy@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = mailto;
  });
}
