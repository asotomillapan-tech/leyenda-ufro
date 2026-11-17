// Interactive Mini-Games Module for NOT F.C Daily Tasks
// Exports mountNotFcMiniGame({ container, type, onWin, onClose }) -> { destroy() }

export function mountNotFcMiniGame({ container, type, onWin, onClose }) {
  if (!container) return { destroy() {} };

  if (type === 'penalty') {
    return mountPenaltyGame(container, onWin, onClose);
  }
  if (type === 'rondo') {
    return mountRondoGame(container, onWin, onClose);
  }
  return mountKeeperGame(container, onWin, onClose);
}

// ==================== 1. PENALES DE PRECISIÓN F7 (CANVAS) ====================
function mountPenaltyGame(container, onWin, onClose) {
  const TARGET_GOALS = 3;
  const MAX_SHOTS = 5;

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-2">
        <div>
          <span class="text-[10px] font-black uppercase tracking-widest text-[#8b96ff]">Minijuego Táctico · Tiro</span>
          <h3 class="text-base font-black text-white">Penales de Precisión F7</h3>
        </div>
        <button type="button" data-mg-close class="w-8 h-8 rounded-lg bg-[#151515] hover:bg-[#242424] border border-[#2b2b2b] text-gray-400 hover:text-white font-bold text-sm transition" aria-label="Cerrar minijuego">✕</button>
      </div>

      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="p-2.5 rounded-xl surface-sub">
          <div class="text-[10px] font-bold text-gray-400 uppercase">Goles</div>
          <div id="mg-pen-goals" class="text-lg font-black text-emerald-400 tabular-nums">0 / ${TARGET_GOALS}</div>
        </div>
        <div class="p-2.5 rounded-xl surface-sub">
          <div class="text-[10px] font-bold text-gray-400 uppercase">Tiros</div>
          <div id="mg-pen-shots" class="text-lg font-black text-white tabular-nums">0 / ${MAX_SHOTS}</div>
        </div>
        <div class="p-2.5 rounded-xl surface-sub">
          <div class="text-[10px] font-bold text-gray-400 uppercase">Estado</div>
          <div id="mg-pen-status" class="text-xs font-black text-[#a3adff] mt-1">Apunta y patea</div>
        </div>
      </div>

      <div class="relative rounded-2xl overflow-hidden border border-[#2b2b2b] bg-[#0f291e]">
        <canvas id="mg-pen-canvas" width="480" height="260" class="w-full h-auto block cursor-crosshair"></canvas>
      </div>

      <div class="flex items-center justify-between gap-3">
        <span class="text-[11px] text-gray-400">Toca el arco o presiona <strong class="text-white">Espacio</strong> cuando la mira esquive al arquero.</span>
        <div class="flex gap-2 shrink-0">
          <button type="button" id="mg-pen-retry" class="hidden px-4 py-2.5 rounded-xl bg-[#242424] hover:bg-[#2e2e2e] text-white font-black text-xs transition">Reintentar</button>
          <button type="button" id="mg-pen-shoot" class="px-5 py-2.5 rounded-xl bg-[#717fff] hover:bg-[#828eff] text-white font-black text-xs shadow transition">⚽ ¡Patear!</button>
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#mg-pen-canvas');
  const ctx = canvas.getContext('2d');
  const goalsEl = container.querySelector('#mg-pen-goals');
  const shotsEl = container.querySelector('#mg-pen-shots');
  const statusEl = container.querySelector('#mg-pen-status');
  const shootBtn = container.querySelector('#mg-pen-shoot');
  const retryBtn = container.querySelector('#mg-pen-retry');
  const closeBtn = container.querySelector('[data-mg-close]');

  let goals = 0;
  let shots = 0;
  let aimX = 240;
  let aimDir = 1;
  let keeperX = 240;
  let keeperDir = -1;
  let ballState = null; // { startX, startY, targetX, targetY, t, scored }
  let finished = false;
  let rafId = 0;
  let lastTime = performance.now();

  const GOAL_LEFT = 90;
  const GOAL_RIGHT = 390;
  const GOAL_TOP = 38;
  const GOAL_BOTTOM = 135;

  function resetGame() {
    goals = 0;
    shots = 0;
    aimX = 240;
    keeperX = 240;
    ballState = null;
    finished = false;
    goalsEl.textContent = `0 / ${TARGET_GOALS}`;
    shotsEl.textContent = `0 / ${MAX_SHOTS}`;
    statusEl.textContent = 'Apunta y patea';
    statusEl.className = 'text-xs font-black text-[#a3adff] mt-1';
    shootBtn.classList.remove('hidden');
    retryBtn.classList.add('hidden');
  }

  function triggerShot(customTargetX = null) {
    if (finished || ballState) return;
    const tx = customTargetX !== null
      ? Math.max(GOAL_LEFT + 14, Math.min(GOAL_RIGHT - 14, customTargetX))
      : aimX;

    // Keeper predicts slightly with natural reaction offset
    const diveOffset = (Math.random() - 0.5) * 95;
    const predictedKeeperX = Math.max(GOAL_LEFT + 24, Math.min(GOAL_RIGHT - 24, keeperX + diveOffset));
    const scored = Math.abs(tx - predictedKeeperX) > 36;

    ballState = {
      startX: 240,
      startY: 228,
      targetX: tx,
      targetY: GOAL_TOP + 34 + Math.random() * 44,
      keeperTargetX: predictedKeeperX,
      t: 0,
      scored,
      resolved: false,
    };
  }

  function draw(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (!ballState && !finished) {
      aimX += aimDir * 290 * dt;
      if (aimX >= GOAL_RIGHT - 14) { aimX = GOAL_RIGHT - 14; aimDir = -1; }
      if (aimX <= GOAL_LEFT + 14) { aimX = GOAL_LEFT + 14; aimDir = 1; }

      keeperX += keeperDir * 155 * dt;
      if (keeperX >= GOAL_RIGHT - 34) { keeperX = GOAL_RIGHT - 34; keeperDir = -1; }
      if (keeperX <= GOAL_LEFT + 34) { keeperX = GOAL_LEFT + 34; keeperDir = 1; }
    }

    if (ballState) {
      ballState.t = Math.min(1, ballState.t + dt * 3.1);
      keeperX += (ballState.keeperTargetX - keeperX) * Math.min(1, dt * 10);

      if (ballState.t >= 1 && !ballState.resolved) {
        ballState.resolved = true;
        shots += 1;
        if (ballState.scored) {
          goals += 1;
          statusEl.textContent = '¡GOOOL!';
          statusEl.className = 'text-xs font-black text-emerald-400 mt-1';
        } else {
          statusEl.textContent = '¡Atajado!';
          statusEl.className = 'text-xs font-black text-rose-400 mt-1';
        }
        goalsEl.textContent = `${goals} / ${TARGET_GOALS}`;
        shotsEl.textContent = `${shots} / ${MAX_SHOTS}`;

        setTimeout(() => {
          ballState = null;
          if (goals >= TARGET_GOALS) {
            finished = true;
            statusEl.textContent = '¡Desafío Superado!';
            statusEl.className = 'text-xs font-black text-emerald-300 mt-1';
            shootBtn.classList.add('hidden');
            onWin({ goals, shots });
          } else if (shots >= MAX_SHOTS) {
            finished = true;
            statusEl.textContent = 'Faltaron goles';
            statusEl.className = 'text-xs font-black text-rose-300 mt-1';
            shootBtn.classList.add('hidden');
            retryBtn.classList.remove('hidden');
          }
        }, 420);
      }
    }

    // Draw turf
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f291e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#133325';
    ctx.fillRect(0, 140, canvas.width, 120);

    // Penalty box lines
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(52, 135, 376, 115);

    // Goal net & posts
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(GOAL_LEFT, GOAL_TOP, GOAL_RIGHT - GOAL_LEFT, GOAL_BOTTOM - GOAL_TOP);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(GOAL_LEFT, GOAL_BOTTOM);
    ctx.lineTo(GOAL_LEFT, GOAL_TOP);
    ctx.lineTo(GOAL_RIGHT, GOAL_TOP);
    ctx.lineTo(GOAL_RIGHT, GOAL_BOTTOM);
    ctx.stroke();

    // Goalkeeper
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(keeperX - 18, 76, 36, 52, 8);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(keeperX, 66, 10, 0, Math.PI * 2);
    ctx.fill();

    // Aim reticle
    if (!ballState && !finished) {
      ctx.strokeStyle = '#8b96ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(aimX, 82, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#717fff';
      ctx.beginPath();
      ctx.arc(aimX, 82, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ball
    let bx = 240;
    let by = 228;
    let scale = 1;
    if (ballState) {
      const e = 1 - Math.pow(1 - ballState.t, 2);
      bx = ballState.startX + (ballState.targetX - ballState.startX) * e;
      by = ballState.startY + (ballState.targetY - ballState.startY) * e;
      scale = 1 - 0.32 * e;
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx, by, 10 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#151515';
    ctx.lineWidth = 2;
    ctx.stroke();

    rafId = requestAnimationFrame(draw);
  }

  const onCanvasClick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const rx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    triggerShot(rx);
  };
  const onKeyDown = (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      triggerShot();
    }
  };

  canvas.addEventListener('click', onCanvasClick);
  shootBtn.addEventListener('click', () => triggerShot());
  retryBtn.addEventListener('click', resetGame);
  closeBtn.addEventListener('click', onClose);
  window.addEventListener('keydown', onKeyDown);
  rafId = requestAnimationFrame(draw);

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('click', onCanvasClick);
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}

// ==================== 2. RONDO DE PASES RÁPIDOS ====================
function mountRondoGame(container, onWin, onClose) {
  const TARGET_PASSES = 6;
  const NODES = [
    { id: 0, label: 'ARQ · Cierre', pos: 'ARQ' },
    { id: 1, label: 'DEF · Izq', pos: 'DEF' },
    { id: 2, label: 'DEF · Der', pos: 'DEF' },
    { id: 3, label: 'MED · Enlace', pos: 'MED' },
    { id: 4, label: 'MED · Ala', pos: 'MED' },
    { id: 5, label: 'DEL · Punta', pos: 'DEL' },
  ];

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-2">
        <div>
          <span class="text-[10px] font-black uppercase tracking-widest text-[#8b96ff]">Minijuego Táctico · Pase</span>
          <h3 class="text-base font-black text-white">Rondo de Pases Rápidos F7</h3>
        </div>
        <button type="button" data-mg-close class="w-8 h-8 rounded-lg bg-[#151515] hover:bg-[#242424] border border-[#2b2b2b] text-gray-400 hover:text-white font-bold text-sm transition" aria-label="Cerrar minijuego">✕</button>
      </div>

      <div class="flex items-center justify-between gap-3 p-3 rounded-xl surface-sub text-xs">
        <span>Pases seguidos: <strong id="mg-rondo-count" class="text-emerald-400 tabular-nums">0 / ${TARGET_PASSES}</strong></span>
        <span id="mg-rondo-hint" class="font-bold text-[#a3adff]">Toca al compañero iluminado antes que presionen</span>
      </div>

      <div class="w-full h-2 rounded-full bg-[#151515] border border-[#262626] overflow-hidden">
        <div id="mg-rondo-timer-bar" class="h-full bg-[#717fff] transition-all duration-75" style="width: 100%"></div>
      </div>

      <div id="mg-rondo-grid" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-4 rounded-2xl border border-emerald-500/30 bg-[#0f291e]">
        ${NODES.map((n, idx) => `
          <button type="button" data-rondo-idx="${idx}"
            class="p-3.5 rounded-xl border border-white/15 bg-[#151515]/85 text-left transition flex items-center justify-between gap-2">
            <div>
              <div class="text-[10px] font-black text-[#a3adff]">[${idx + 1}] ${n.pos}</div>
              <div class="text-xs font-bold text-white">${n.label}</div>
            </div>
            <span class="rondo-badge text-xs font-black"></span>
          </button>
        `).join('')}
      </div>

      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] text-gray-400">Atajo teclado: teclas <strong class="text-white">1–6</strong> o clic directo.</span>
        <button type="button" id="mg-rondo-retry" class="hidden px-4 py-2 rounded-xl bg-[#717fff] hover:bg-[#828eff] text-white font-black text-xs">Reintentar Rondo</button>
      </div>
    </div>
  `;

  const countEl = container.querySelector('#mg-rondo-count');
  const hintEl = container.querySelector('#mg-rondo-hint');
  const barEl = container.querySelector('#mg-rondo-timer-bar');
  const retryBtn = container.querySelector('#mg-rondo-retry');
  const closeBtn = container.querySelector('[data-mg-close]');
  const btns = Array.from(container.querySelectorAll('[data-rondo-idx]'));

  let passes = 0;
  let activeIdx = 0;
  let timeRemainingMs = 2800;
  const maxTimeMs = 2800;
  let stopped = false;

  function pickNextTarget() {
    let next = Math.floor(Math.random() * NODES.length);
    if (next === activeIdx) next = (activeIdx + 1) % NODES.length;
    activeIdx = next;
    timeRemainingMs = maxTimeMs;

    btns.forEach((btn, idx) => {
      const badge = btn.querySelector('.rondo-badge');
      if (idx === activeIdx) {
        btn.className = 'p-3.5 rounded-xl border-2 border-emerald-400 bg-[#717fff] text-white text-left transition flex items-center justify-between gap-2 shadow-lg';
        if (badge) badge.textContent = '⚽ ¡PASA!';
      } else {
        btn.className = 'p-3.5 rounded-xl border border-white/15 bg-[#151515]/85 hover:border-white/30 text-left transition flex items-center justify-between gap-2';
        if (badge) badge.textContent = '';
      }
    });
  }

  function handlePassClick(idx) {
    if (stopped) return;
    if (idx === activeIdx) {
      passes += 1;
      countEl.textContent = `${passes} / ${TARGET_PASSES}`;
      if (passes >= TARGET_PASSES) {
        stopped = true;
        clearInterval(tickId);
        hintEl.textContent = '¡Rondo perfecto! +EX y +€ acreditados';
        hintEl.className = 'font-black text-emerald-400';
        onWin({ passes });
        return;
      }
      pickNextTarget();
    } else {
      passes = Math.max(0, passes - 1);
      countEl.textContent = `${passes} / ${TARGET_PASSES}`;
      hintEl.textContent = '¡Pase errado! Busca al jugador iluminado';
      hintEl.className = 'font-bold text-rose-400';
    }
  }

  const tickId = setInterval(() => {
    if (stopped) return;
    timeRemainingMs -= 80;
    const pct = Math.max(0, Math.round((timeRemainingMs / maxTimeMs) * 100));
    barEl.style.width = `${pct}%`;
    if (timeRemainingMs <= 0) {
      stopped = true;
      hintEl.textContent = 'El rival interceptó el balón. ¡Inténtalo otra vez!';
      hintEl.className = 'font-bold text-rose-400';
      retryBtn.classList.remove('hidden');
    }
  }, 80);

  function restart() {
    passes = 0;
    stopped = false;
    countEl.textContent = `0 / ${TARGET_PASSES}`;
    hintEl.textContent = 'Toca al compañero iluminado antes que presionen';
    hintEl.className = 'font-bold text-[#a3adff]';
    retryBtn.classList.add('hidden');
    pickNextTarget();
  }

  const onKeyDown = (e) => {
    const num = Number(e.key);
    if (num >= 1 && num <= 6) {
      handlePassClick(num - 1);
    }
  };

  btns.forEach((b) => b.addEventListener('click', () => handlePassClick(Number(b.dataset.rondoIdx))));
  retryBtn.addEventListener('click', restart);
  closeBtn.addEventListener('click', onClose);
  window.addEventListener('keydown', onKeyDown);
  pickNextTarget();

  return {
    destroy() {
      clearInterval(tickId);
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}

// ==================== 3. REFLEJOS BAJO LOS 3 PALOS ====================
function mountKeeperGame(container, onWin, onClose) {
  const TARGET_SAVES = 4;
  const LANES = [
    { idx: 0, label: 'Izquierda [A]', short: 'IZQ' },
    { idx: 1, label: 'Centro [S]', short: 'CEN' },
    { idx: 2, label: 'Derecha [D]', short: 'DER' },
  ];

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-2">
        <div>
          <span class="text-[10px] font-black uppercase tracking-widest text-[#8b96ff]">Minijuego Táctico · Reflejos</span>
          <h3 class="text-base font-black text-white">Reflejos bajo los 3 Palos</h3>
        </div>
        <button type="button" data-mg-close class="w-8 h-8 rounded-lg bg-[#151515] hover:bg-[#242424] border border-[#2b2b2b] text-gray-400 hover:text-white font-bold text-sm transition" aria-label="Cerrar minijuego">✕</button>
      </div>

      <div class="flex items-center justify-between gap-2 p-3 rounded-xl surface-sub text-xs">
        <span>Atajadas: <strong id="mg-gk-saves" class="text-emerald-400 tabular-nums">0 / ${TARGET_SAVES}</strong></span>
        <span id="mg-gk-msg" class="font-bold text-[#a3adff]">Bloquea el carril donde aparece el balón</span>
      </div>

      <div class="grid grid-cols-3 gap-3 p-4 rounded-2xl border border-[#2b2b2b] bg-[#0f291e]">
        ${LANES.map((l) => `
          <button type="button" data-gk-lane="${l.idx}"
            class="h-32 rounded-2xl border border-white/20 bg-[#151515]/85 flex flex-col items-center justify-center gap-2 transition">
            <span class="gk-ball text-2xl">🥅</span>
            <span class="text-xs font-black text-white">${l.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  const savesEl = container.querySelector('#mg-gk-saves');
  const msgEl = container.querySelector('#mg-gk-msg');
  const closeBtn = container.querySelector('[data-mg-close]');
  const laneBtns = Array.from(container.querySelectorAll('[data-gk-lane]'));

  let saves = 0;
  let activeLane = -1;
  let done = false;

  function spawnShot() {
    if (done) return;
    activeLane = Math.floor(Math.random() * 3);
    laneBtns.forEach((btn, idx) => {
      const icon = btn.querySelector('.gk-ball');
      if (idx === activeLane) {
        btn.className = 'h-32 rounded-2xl border-2 border-amber-400 bg-amber-500/20 flex flex-col items-center justify-center gap-2 transition scale-[1.02]';
        if (icon) icon.textContent = '⚽🔥';
      } else {
        btn.className = 'h-32 rounded-2xl border border-white/20 bg-[#151515]/85 flex flex-col items-center justify-center gap-2 transition';
        if (icon) icon.textContent = '🥅';
      }
    });
  }

  function dive(laneIdx) {
    if (done || activeLane === -1) return;
    if (laneIdx === activeLane) {
      saves += 1;
      savesEl.textContent = `${saves} / ${TARGET_SAVES}`;
      msgEl.textContent = '¡Tapadón!';
      msgEl.className = 'font-black text-emerald-400';
      if (saves >= TARGET_SAVES) {
        done = true;
        onWin({ saves });
        return;
      }
      spawnShot();
    } else {
      msgEl.textContent = '¡Se escapó! Atento al balón';
      msgEl.className = 'font-bold text-rose-400';
      spawnShot();
    }
  }

  const onKeyDown = (e) => {
    const k = e.key.toLowerCase();
    if (k === 'a' || e.key === 'ArrowLeft') dive(0);
    else if (k === 's' || e.key === 'ArrowDown') dive(1);
    else if (k === 'd' || e.key === 'ArrowRight') dive(2);
  };

  laneBtns.forEach((b) => b.addEventListener('click', () => dive(Number(b.dataset.gkLane))));
  closeBtn.addEventListener('click', onClose);
  window.addEventListener('keydown', onKeyDown);
  spawnShot();

  return {
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}
