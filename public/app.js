import { api, formatDate, sparkles, confetti } from './common.js';

const $ = (s) => document.querySelector(s);
let current = null;

function showInfo(giftDate, giftNote) {
  const box = $('#info');
  const parts = [];
  if (giftDate) parts.push(`🎁 Gift exchange: <b></b>`);
  if (giftNote) parts.push(`<span class="note"></span>`);
  if (!parts.length) { box.hidden = true; return; }
  box.innerHTML = parts.join('<br>');
  if (giftDate) box.querySelector('b').textContent = formatDate(giftDate);
  if (giftNote) box.querySelector('.note').textContent = giftNote;
  box.hidden = false;
}

function showBanner(s) {
  const b = $('#banner');
  if (s.giftDate) {
    b.hidden = false;
    b.innerHTML = '🎁 Gift exchange: <b></b>';
    b.querySelector('b').textContent = formatDate(s.giftDate);
  } else b.hidden = true;
}

function renderNames(s) {
  const box = $('#names');
  box.textContent = '';
  if (!s.names.length) {
    $('#pick-msg').textContent = 'The dancers are still warming up — check back soon!';
    return;
  }
  for (const name of s.names) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'name-btn';
    b.textContent = name;
    b.addEventListener('click', () => openStage(name));
    box.appendChild(b);
  }
}

function openStage(name) {
  current = name;
  $('#me').textContent = name;
  $('#theater').classList.remove('open');
  $('#r-small').textContent = '';
  $('#r-name').textContent = '';
  $('#r-msg').textContent = '';
  $('#stage-msg').textContent = '';
  $('#shh').hidden = false;
  $('#info').hidden = true;
  $('#pull').hidden = false;
  $('#pull').disabled = false;
  $('#pick').hidden = true;
  $('#stage').hidden = false;
  $('#pull').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function pull() {
  $('#pull').disabled = true;
  $('#stage-msg').textContent = '';
  try {
    const r = await api('reveal', { name: current });
    if (!r.drawn) {
      $('#r-msg').textContent = '🎄 The names haven\'t been drawn yet. Come back soon!';
      $('#theater').classList.add('open');
      $('#pull').disabled = false;
      return;
    }
    $('#r-small').textContent = 'You are the Secret Santa for…';
    $('#r-name').textContent = r.giftee;
    $('#theater').classList.add('open');
    $('#pull').hidden = true;
    showInfo(r.giftDate, r.giftNote);
    setTimeout(confetti, 700);
  } catch (e) {
    $('#stage-msg').textContent = e.message;
    $('#pull').disabled = false;
  }
}

function back() {
  current = null;
  $('#stage').hidden = true;
  $('#pick').hidden = false;
  $('#theater').classList.remove('open');
  $('#r-name').textContent = '';   // don't leave a secret on screen
  window.scrollTo({ top: 0 });
}

async function init() {
  sparkles();
  $('#pull').addEventListener('click', pull);
  $('#back').addEventListener('click', back);
  try {
    const s = await api('state');
    showBanner(s);
    renderNames(s);
  } catch {
    $('#pick-msg').textContent = 'Oops, we could not load the dancers. Please refresh the page.';
  }
}
init();
