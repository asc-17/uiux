const views = ['receipt', 'details', 'report'];
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const form = document.querySelector('#report-form');
const formWrap = document.querySelector('#report-form-wrap');
const success = document.querySelector('#report-success');

function showView() {
  const requested = location.hash.slice(1) || 'receipt';
  const current = views.includes(requested) ? requested : 'receipt';
  document.body.dataset.view = current;
  views.forEach((view) => {
    document.querySelector(`#${view}-view`).hidden = view !== current;
    const nav = document.querySelector(`[data-nav="${view}"]`);
    nav.classList.toggle('active', view === current);
    if (view === current) nav.setAttribute('aria-current', 'page');
    else nav.removeAttribute('aria-current');
  });
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  document.title = `${current === 'receipt' ? 'Your delivery, verified' : current === 'details' ? 'Delivery details' : 'Get help'} | airmark.`;
  window.scrollTo(0, 0);
}

document.querySelectorAll('[data-go]').forEach((button) => {
  button.addEventListener('click', () => {
    const destination = button.dataset.go;
    if (location.hash === `#${destination}`) showView();
    else location.hash = destination;
  });
});

menuButton.addEventListener('click', () => {
  mobileNav.hidden = !mobileNav.hidden;
  menuButton.setAttribute('aria-expanded', String(!mobileNav.hidden));
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const reference = `AM-${Date.now().toString().slice(-6)}`;
  const report = Object.fromEntries(new FormData(form));
  try {
    const reports = JSON.parse(localStorage.getItem('airmarkReports') || '[]');
    reports.push({ ...report, reference, createdAt: new Date().toISOString() });
    localStorage.setItem('airmarkReports', JSON.stringify(reports));
  } catch {
    document.querySelector('#report-success > p').textContent = 'Your demo report could not be saved in this browser. No message has been sent to a support team.';
  }
  document.querySelector('#case-number').textContent = reference;
  formWrap.hidden = true;
  success.hidden = false;
  success.querySelector('h2').focus({ preventScroll: true });
});

document.querySelector('.reset-report').addEventListener('click', () => {
  form.reset();
  document.querySelector('#report-success > p').textContent = 'Your demo report has been saved in this browser. No message has been sent to a support team.';
  formWrap.hidden = false;
  success.hidden = true;
});

window.addEventListener('hashchange', showView);
document.querySelectorAll('[data-scroll-receipt]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('#delivery-receipt').scrollIntoView({ behavior: 'smooth' });
  });
});
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal, .hero-copy, .map-panel, .receipt-strip, .page-heading, .details-grid, .report-layout').forEach((element) => revealObserver.observe(element));
const heroVideo = document.querySelector('.cinema-video');
const videoObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroVideo.play().catch(() => {});
  } else {
    heroVideo.pause();
  }
});
videoObserver.observe(heroVideo);
showView();
if (window.lucide) lucide.createIcons();