// Mobile nav
const toggle = document.querySelector('.nav-toggle');
const navList = document.getElementById('nav-list');
toggle.addEventListener('click', () => {
  const open = navList.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
navList.addEventListener('click', e => {
  if (e.target.tagName === 'A') { navList.classList.remove('open'); toggle.setAttribute('aria-expanded', false); }
});

// Residences filter
const filterBtns = document.querySelectorAll('.filter button');
const units = document.querySelectorAll('.units li');
filterBtns.forEach(btn => btn.addEventListener('click', () => {
  filterBtns.forEach(b => b.setAttribute('aria-selected', b === btn));
  const f = btn.dataset.filter;
  units.forEach(u => { u.hidden = f !== 'all' && u.dataset.type !== f; });
}));

// "Cost sheet" links preselect the unit in the form
document.querySelectorAll('[data-unit]').forEach(a => a.addEventListener('click', () => {
  document.querySelector('select[name="unit"]').value = a.dataset.unit;
}));

// Schematic floor plans: [x, y, w, h, label, class]
const PLANS = {
  p813: [
    [20, 20, 150, 120, 'Living / Dining'], [170, 20, 110, 70, 'Kitchen'], [170, 90, 50, 50, 'Utility', 'wet'],
    [220, 90, 60, 50, 'Toilet', 'wet'], [20, 140, 130, 110, 'Master bed'], [150, 140, 50, 60, 'Bath', 'wet'],
    [200, 140, 120, 110, 'Bedroom 2'], [280, 20, 90, 120, 'Deck', 'out'],
  ],
  p900: [
    [20, 20, 170, 120, 'Living / Dining'], [190, 20, 110, 70, 'Kitchen'], [190, 90, 50, 50, 'Utility', 'wet'],
    [240, 90, 60, 50, 'Toilet', 'wet'], [20, 140, 140, 115, 'Master bed'], [160, 140, 50, 60, 'Bath', 'wet'],
    [210, 140, 130, 115, 'Bedroom 2'], [300, 20, 80, 120, 'Deck', 'out'], [340, 140, 40, 115, 'Balc.', 'out'],
  ],
  p1116: [
    [20, 20, 160, 120, 'Living / Dining'], [180, 20, 100, 70, 'Kitchen'], [180, 90, 50, 50, 'Utility', 'wet'],
    [230, 90, 50, 50, 'Toilet', 'wet'], [280, 20, 100, 120, 'Bedroom 3'], [20, 140, 120, 120, 'Master bed'],
    [140, 140, 50, 60, 'Bath', 'wet'], [190, 140, 110, 120, 'Bedroom 2'], [300, 140, 80, 120, 'Deck', 'out'],
  ],
  p1231: [
    [20, 20, 180, 125, 'Living / Dining'], [200, 20, 100, 70, 'Kitchen'], [200, 90, 50, 55, 'Utility', 'wet'],
    [250, 90, 50, 55, 'Toilet', 'wet'], [300, 20, 85, 125, 'Bedroom 3'], [20, 145, 130, 120, 'Master bed'],
    [150, 145, 50, 60, 'Bath', 'wet'], [200, 145, 50, 60, 'Bath', 'wet'], [250, 145, 135, 120, 'Bedroom 2'],
    [150, 205, 100, 60, 'Deck', 'out'],
  ],
};
const svg = document.getElementById('plan-svg');
function drawPlan(key) {
  svg.innerHTML = PLANS[key].map(([x, y, w, h, label, cls = '']) =>
    `<rect class="room ${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>` +
    `<text x="${x + w / 2}" y="${y + h / 2 + 3}">${label}</text>`
  ).join('');
}
const planBtns = document.querySelectorAll('.plan-tabs button');
planBtns.forEach(btn => btn.addEventListener('click', () => {
  planBtns.forEach(b => b.setAttribute('aria-selected', b === btn));
  drawPlan(btn.dataset.plan);
}));
drawPlan('p813');

// Enquiry form → Lead Desk webhook
// The URL comes from config.js, generated from the LEAD_DESK_WEBHOOK_URL
// environment variable by generate-config.sh.
const LEAD_DESK_WEBHOOK_URL = (window.SITE_CONFIG && window.SITE_CONFIG.LEAD_DESK_WEBHOOK_URL) || '';

const form = document.getElementById('enquiry');
const msg = form.querySelector('.form-msg');
const submitBtn = form.querySelector('button[type="submit"]');
function say(text, isErr) { msg.textContent = text; msg.classList.toggle('err', !!isErr); }

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!form.checkValidity()) {
    say('Please add your name, a valid mobile number and tick the consent box.', true);
    return;
  }
  if (!LEAD_DESK_WEBHOOK_URL) {
    say('The enquiry form is not connected yet. Please call us instead.', true);
    console.warn('No webhook URL. Set LEAD_DESK_WEBHOOK_URL and run: sh generate-config.sh');
    return;
  }

  const f = form.elements;
  const payload = {
    name: f['name'].value.trim(),
    phone: f['phone'].value.replace(/[^\d+]/g, ''),
    interested_in: f['unit'].value,
    preferred_visit_date: f['date'].value || null,   // YYYY-MM-DD or null
    consent: f['consent'].checked,
    project: 'Echoes at Life Republic',
    source: 'website',
    page_url: location.href,
    submitted_at: new Date().toISOString(),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';
  try {
    const res = await fetch(LEAD_DESK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    say(`Thanks, ${payload.name.split(' ')[0]}. We'll call you shortly to fix your visit.`);
    form.reset();
  } catch (err) {
    console.error(err);
    say('Could not send right now. Please try again in a moment.', true);   // keeps what they typed
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Request a visit';
  }
});

// Reveal on scroll
const io = 'IntersectionObserver' in window && new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
}, { threshold: .12 });
document.querySelectorAll('.section-head, .township-grid, .units, .plans-pay, .plan-switch, .amenities, .loc-grid, .visit-form, .faq-list')
  .forEach(el => { if (io) { el.classList.add('reveal'); io.observe(el); } });
