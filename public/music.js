// Quiet background music with a mute button. Browsers block sound until the visitor
// interacts, so we try to start right away and otherwise start on the first tap/key.
const KEY = 'santa-music-muted';
const VOLUME = 0.18;

let muted = false;
try { muted = localStorage.getItem(KEY) === '1'; } catch { /* storage may be blocked */ }

const audio = new Audio('/audio/sugar-plum-fairy.mp3');
audio.loop = true;
audio.volume = VOLUME;
audio.preload = 'auto';

const btn = document.getElementById('music');

function paint() {
  const on = !muted && !audio.paused;
  btn.textContent = on ? '🎵' : '🔇';
  btn.setAttribute('aria-pressed', String(on));
  btn.setAttribute('aria-label', on ? 'Turn the music off' : 'Turn the music on');
  btn.title = on ? 'Music on (tap to mute)' : 'Music off (tap to play)';
}

async function start() {
  if (muted) return paint();
  try { await audio.play(); } catch { /* blocked until a gesture */ }
  paint();
}

function unlockOnFirstGesture() {
  const go = () => {
    removeEventListener('pointerdown', go, true);
    removeEventListener('keydown', go, true);
    if (!muted) start();
  };
  addEventListener('pointerdown', go, true);
  addEventListener('keydown', go, true);
}

btn.addEventListener('click', async (e) => {
  e.stopPropagation();
  if (muted || audio.paused) {
    muted = false;
    try { localStorage.setItem(KEY, '0'); } catch { /* ignore */ }
    await start();
  } else {
    muted = true;
    audio.pause();
    try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    paint();
  }
});

paint();
start();
unlockOnFirstGesture();
