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

// Contact form -> /api/contact (Vercel serverless function, sends via Resend)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const submitBtnDefaultText = submitBtn.textContent;
  const formStatus = document.getElementById('formStatus');
  const formSuccess = document.getElementById('formSuccess');
  const sendAnotherBtn = document.getElementById('sendAnother');
  const loadedAtInput = contactForm.querySelector('input[name="loadedAt"]');
  const genericErrorMessage = "Something went wrong. We couldn't send your message. Please try again or contact us directly by email.";

  if (loadedAtInput) loadedAtInput.value = String(Date.now());

  let isSubmitting = false;

  function setStatus(message, state) {
    if (!formStatus) return;
    formStatus.textContent = message || '';
    if (state) formStatus.setAttribute('data-state', state);
    else formStatus.removeAttribute('data-state');
  }

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!contactForm.reportValidity()) return;

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    setStatus('Sending your message…');

    const data = new FormData(contactForm);
    const payload = {
      name: (data.get('name') || '').toString().trim(),
      email: (data.get('email') || '').toString().trim(),
      organization: (data.get('organization') || '').toString().trim(),
      interest: (data.get('interest') || '').toString().trim(),
      message: (data.get('message') || '').toString().trim(),
      company: (data.get('company') || '').toString(), // honeypot
      loadedAt: Number(data.get('loadedAt')) || 0
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.ok) {
        setStatus('');
        contactForm.hidden = true;
        if (formSuccess) {
          formSuccess.hidden = false;
          formSuccess.focus();
        }
      } else {
        setStatus(result.error || genericErrorMessage, 'error');
      }
    } catch (err) {
      setStatus(genericErrorMessage, 'error');
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtnDefaultText;
    }
  });

  if (sendAnotherBtn) {
    sendAnotherBtn.addEventListener('click', () => {
      contactForm.reset();
      if (loadedAtInput) loadedAtInput.value = String(Date.now());
      formSuccess.hidden = true;
      contactForm.hidden = false;
      setStatus('');
      const nameField = document.getElementById('name');
      if (nameField) nameField.focus();
    });
  }
}

// "Start a conversation" links land on #contact-form-section — move focus to
// the first field for keyboard/screen-reader users, not just visual scroll.
if (window.location.hash === '#contact-form-section') {
  window.addEventListener('load', () => {
    const nameField = document.getElementById('name');
    if (nameField) nameField.focus({ preventScroll: true });
  });
}
