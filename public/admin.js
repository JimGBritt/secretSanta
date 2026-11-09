import { api, sparkles } from './common.js';

const $ = (s) => document.querySelector(s);
let key = '';

const say = (text, ok = false) => { const m = $('#msg'); m.textContent = text; m.className = 'status ' + (ok ? 'ok' : 'msg-err'); };
const lines = () => $('#names').value.split('\n').map((s) => s.trim()).filter(Boolean);

function render(s) {
  $('#login').hidden = true;
  $('#panel').hidden = false;
  if (document.activeElement !== $('#names')) $('#names').value = s.names.join('\n');
  $('#date').value = s.giftDate || '';
  $('#note').value = s.giftNote || '';
  $('#status-pill').textContent = s.drawn ? 'Names have been drawn 🎉' : 'Not drawn yet';
  $('#count').textContent = `${s.names.length} dancer${s.names.length === 1 ? '' : 's'} saved`;
  $('#draw').disabled = s.drawn || s.names.length < 2;
  $('#reset').disabled = !s.drawn;
  $('#link').textContent = location.origin + '/';
}

async function call(action, extra = {}) {
  return api('manage/' + action, { key, ...extra });
}

async function login() {
  key = $('#key').value;
  $('#login-msg').textContent = '';
  try {
    render(await call('check'));
    try { sessionStorage.setItem('ak', key); } catch { /* ignore */ }
  } catch (e) { $('#login-msg').textContent = e.message; }
}

async function save() {
  try {
    const s = await call('save', { names: lines(), giftDate: $('#date').value, giftNote: $('#note').value });
    render(s); say('Saved ✨', true);
  } catch (e) { say(e.message); }
}

async function draw() {
  if (!confirm(`Draw names for ${lines().length} dancers now? Make sure you saved the list first.`)) return;
  try { render(await call('draw')); say('Names drawn! Send the link to parents 🎉', true); } catch (e) { say(e.message); }
}

async function reset() {
  if (!confirm('Reset the draw? Everyone will get a NEW match the next time you draw.')) return;
  try { render(await call('reset')); say('Draw reset.', true); } catch (e) { say(e.message); }
}

sparkles();
$('#go').addEventListener('click', login);
$('#key').addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
$('#save').addEventListener('click', save);
$('#draw').addEventListener('click', draw);
$('#reset').addEventListener('click', reset);
try { const k = sessionStorage.getItem('ak'); if (k) { $('#key').value = k; login(); } } catch { /* ignore */ }
