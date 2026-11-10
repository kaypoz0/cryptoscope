(() => {
  const FIELD = document.getElementById("shark-field");
  const HERO = FIELD?.closest(".hero");
  if (!FIELD || !HERO) return;

  // Classic fish-shell ASCII (ridiculous_fish) — faces left
  const FISH_LEFT = [
    "                  ___",
    "   ___======____=---=)",
    " /T            \\_--===)",
    " L \\ (@)   \\~    \\_-==)",
    "  \\      / )J~~    \\-=)",
    "   \\\\___/  )JJ~~    \\)",
    "    \\_____/JJJ~~      \\",
    "    / \\  , \\J~~~~      \\",
    "   (-\\)\\=|  \\~~~        L__",
    "   (\\\\)  ( -\\)_            ==__",
    "    \\V    \\-\\) ===_____  J\\   \\\\",
    "           \\V)     \\_) \\   JJ J\\)",
    "                       /J JT\\JJJJ)",
    "                       (JJJ| \\UUU)",
    "                        (UU)",
  ];

  // Keep the authentic left-facing art only — letter glyphs don't mirror cleanly.
  const SPRITE = FISH_LEFT;
  const SPRITE_W = Math.max(...FISH_LEFT.map((l) => l.length));
  const SPRITE_H = FISH_LEFT.length;

  const FLEE_RADIUS = 180;
  const MAX_SPEED = 4.6;
  const CRUISE = 0.5;

  const fish = [];
  let mouse = { x: -9999, y: -9999, active: false };
  let width = 0;
  let height = 0;
  let spookUntil = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const rect = FIELD.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
  }

  function makeFish() {
    const el = document.createElement("pre");
    el.className = "shark";
    el.setAttribute("aria-hidden", "true");
    FIELD.appendChild(el);

    const scale = 0.62 + Math.random() * 0.22;
    return {
      el,
      x: width * 0.32 + Math.random() * Math.max(width * 0.5, 40),
      y: 24 + Math.random() * Math.max(height - SPRITE_H * 10 * scale - 40, 40),
      vx: Math.random() > 0.5 ? CRUISE : -CRUISE,
      vy: (Math.random() - 0.5) * 0.25,
      phase: Math.random() * Math.PI * 2,
      scale,
      opacity: 0.55 + Math.random() * 0.25,
    };
  }

  function paint(f) {
    f.el.textContent = SPRITE.join("\n");
    f.el.style.transform = `translate(${f.x}px, ${f.y}px) scale(${f.scale})`;
    f.el.style.opacity = String(f.opacity);
  }

  function toFieldCoords(clientX, clientY) {
    const rect = FIELD.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function center(f) {
    return {
      x: f.x + (SPRITE_W * 7.2 * f.scale) / 2,
      y: f.y + (SPRITE_H * 8.5 * f.scale) / 2,
    };
  }

  function fleeVector(f, now) {
    let tx = mouse.x;
    let ty = mouse.y;
    let radius = FLEE_RADIUS;

    if (now < spookUntil) {
      tx = width * 0.65;
      ty = height * 0.45;
      radius = Math.max(width, height);
    } else if (!mouse.active) {
      return null;
    }

    const c = center(f);
    const dx = c.x - tx;
    const dy = c.y - ty;
    const dist = Math.hypot(dx, dy);
    if (dist > radius || dist === 0) return null;
    const force = (1 - dist / radius) * (now < spookUntil ? 3.4 : 2.8);
    return { x: (dx / dist) * force, y: (dy / dist) * force };
  }

  function tick(now) {
    const t = now * 0.001;
    for (const f of fish) {
      if (!reducedMotion) {
        const flee = fleeVector(f, now);
        if (flee) {
          f.vx += flee.x;
          f.vy += flee.y;
          f.opacity = Math.min(0.82, f.opacity + 0.025);
        } else {
          const cruise = f.vx >= 0 ? CRUISE : -CRUISE;
          f.vx += (cruise - f.vx) * 0.02;
          f.vy += (Math.sin(t + f.phase) * 0.3 - f.vy) * 0.03;
          f.opacity += (0.62 - f.opacity) * 0.02;
        }

        const speed = Math.hypot(f.vx, f.vy);
        if (speed > MAX_SPEED) {
          f.vx = (f.vx / speed) * MAX_SPEED;
          f.vy = (f.vy / speed) * MAX_SPEED;
        }

        f.x += f.vx;
        f.y += f.vy;

        const bodyW = SPRITE_W * 7.2 * f.scale;
        const bodyH = SPRITE_H * 8.5 * f.scale;
        const minX = width * 0.18;
        const maxX = Math.max(width - bodyW - 10, minX + 20);
        const maxY = Math.max(height - bodyH - 10, 20);

        if (f.x < minX - 40) {
          f.x = minX - 40;
          f.vx = Math.abs(f.vx);
        } else if (f.x > maxX + 40) {
          f.x = maxX + 40;
          f.vx = -Math.abs(f.vx);
        }
        if (f.y < 8) {
          f.y = 8;
          f.vy = Math.abs(f.vy);
        } else if (f.y > maxY) {
          f.y = maxY;
          f.vy = -Math.abs(f.vy);
        }
      }
      paint(f);
    }
    requestAnimationFrame(tick);
  }

  function onPointer(e) {
    const pts = toFieldCoords(e.clientX, e.clientY);
    mouse.x = pts.x;
    mouse.y = pts.y;
    mouse.active = true;
  }

  function onLeave() {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  }

  resize();
  const count = width < 640 ? 2 : 3;
  for (let i = 0; i < count; i++) fish.push(makeFish());

  HERO.addEventListener("pointermove", onPointer, { passive: true });
  HERO.addEventListener("pointerleave", onLeave);
  window.addEventListener("resize", resize);

  window.spookSharks = () => {
    spookUntil = performance.now() + 1100;
    for (const f of fish) {
      const angle = Math.random() * Math.PI * 2;
      f.vx += Math.cos(angle) * 3;
      f.vy += Math.sin(angle) * 2.2;
    }
  };

  requestAnimationFrame(tick);
})();
