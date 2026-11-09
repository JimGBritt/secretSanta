// Shared helpers + falling sparkles background.
export async function api(path, body) {
  const res = await fetch('/api/' + path, body === undefined ? { cache: 'no-store' } : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong.'), { status: res.status });
  return data;
}

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function sparkles() {
  const box = document.querySelector('.sparkles');
  if (!box) return;
  const bits = ['✨', '⭐', '❄️', '🩰', '💜', '🎀'];
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span');
    s.textContent = bits[i % bits.length];
    s.style.left = Math.random() * 100 + '%';
    s.style.setProperty('--sz', 14 + Math.random() * 16 + 'px');
    s.style.setProperty('--d', 11 + Math.random() * 12 + 's');
    s.style.setProperty('--delay', -Math.random() * 20 + 's');
    s.style.setProperty('--x', (Math.random() * 120 - 60) + 'px');
    box.appendChild(s);
  }
}

export function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bits = ['✨', '⭐', '💜', '🩰', '🎀', '❄️', '🎉'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('span');
    c.className = 'confetti';
    c.textContent = bits[i % bits.length];
    c.style.left = Math.random() * 100 + 'vw';
    c.style.setProperty('--sz', 18 + Math.random() * 22 + 'px');
    c.style.setProperty('--d', 2.2 + Math.random() * 2 + 's');
    c.style.setProperty('--x', (Math.random() * 200 - 100) + 'px');
    c.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg');
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4800);
  }
}
