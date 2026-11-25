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

// ===== Tour videos =====
// Room names, the opening title and the end card are built into the video files themselves.
// preview = the short silent loop [start, end] in seconds shown on the cards.
const TOURS = [
  { src: 'assets/tour/tour-1.mp4', poster: 'assets/tour/tour-1.jpg', title: 'The flat & the gardens', preview: [25.4, 37.4] },
  { src: 'assets/tour/tour-2.mp4', poster: 'assets/tour/tour-2.jpg', title: 'Room by room', preview: [90.4, 104.4] },
];
// Silent looping previews that play only while the card is on screen.
// Skipped for visitors who asked for reduced motion or data saving; they see the cover image.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData;
const tourCards = [...document.querySelectorAll('.tour-card')];

tourCards.forEach(card => {
  const tour = TOURS[card.dataset.index];
  const video = card.querySelector('video');
  const bar = card.querySelector('.tour-progress span');
  const [from, to] = tour.preview;
  card._preview = video;

  video.addEventListener('loadedmetadata', () => { video._seekTried = true; video.currentTime = from; });
  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    if (t >= to) { video.currentTime = from; return; }
    if (t < from - 0.5) {
      // Not at the preview yet: jump there once; if the server can't seek, keep playing from the start
      if (!video._seekTried) { video._seekTried = true; video.currentTime = from; }
      return;
    }
    bar.style.width = `${((t - from) / (to - from)) * 100}%`;
  });
  card.querySelector('.tour-open').addEventListener('click', () => openTour(Number(card.dataset.index)));
});

const previewIO = !reduceMotion && !saveData && 'IntersectionObserver' in window && new IntersectionObserver(entries => {
  entries.forEach(en => {
    const v = en.target.querySelector('video');
    if (en.isIntersecting && !modal.open) {
      if (v.preload === 'none') v.preload = 'auto';
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  });
}, { threshold: 0.45 });
if (previewIO) tourCards.forEach(c => previewIO.observe(c));

// Full player
const modal = document.querySelector('.tour-modal');
const player = modal.querySelector('.tm-video');
const endScreen = modal.querySelector('.tm-end');
let current = 0;
// The background music is mixed into the video files, so the player just plays them with sound.

function openTour(i) {
  current = i;
  const tour = TOURS[i];
  tourCards.forEach(c => c._preview.pause());
  endScreen.hidden = true;
  player.poster = tour.poster;
  player.src = tour.src;
  if (!modal.open) {
    modal.showModal();
    document.body.classList.add('modal-open');
  }
  player.muted = false;
  player.volume = 0.9;
  player.play().catch(() => {});
}

player.addEventListener('play', () => { endScreen.hidden = true; });
player.addEventListener('ended', () => {
  modal.querySelector('.tm-next').textContent = current < TOURS.length - 1 ? 'Next tour →' : 'First tour →';
  endScreen.hidden = false;
});

modal.querySelector('.tm-replay').addEventListener('click', () => { player.currentTime = 0; player.play(); });
modal.querySelector('.tm-next').addEventListener('click', () => openTour((current + 1) % TOURS.length));
modal.querySelector('.tm-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });   // click on backdrop
modal.querySelectorAll('.tm-book').forEach(a => a.addEventListener('click', () => modal.close()));
modal.addEventListener('close', () => {
  player.pause();
  document.body.classList.remove('modal-open');
  // resume previews that are on screen
  if (previewIO) tourCards.forEach(c => { previewIO.unobserve(c); previewIO.observe(c); });
});

// Reveal on scroll
const io = 'IntersectionObserver' in window && new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
}, { threshold: .12 });
document.querySelectorAll('.section-head, .township-grid, .units, .plans-pay, .plan-switch, .tour-grid, .amenities, .loc-grid, .visit-form, .faq-list')
  .forEach(el => { if (io) { el.classList.add('reveal'); io.observe(el); } });
