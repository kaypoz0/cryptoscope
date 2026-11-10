(() => {
  const FIELD = document.getElementById("shark-field");
  const HERO = FIELD?.closest(".hero");
  if (!FIELD || !HERO) return;

  const SPRITES = {
    right: [
      "                 __",
      "              __/ o\\",
      "   __________/   __/",
      "  \\_\\___________/",
      "       /|   |\\",
    ],
    left: [
      "  __",
      " /o \\__",
      " \\__   \\__________",
      "   \\___________/_/",
      "        /|   |\\",
    ],
  };

  const FLEE_RADIUS = 150;
  const MAX_SPEED = 4.6;
  const CRUISE = 0.55;

  const sharks = [];
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

  function makeShark() {
    const el = document.createElement("pre");
    el.className = "shark";
    el.setAttribute("aria-hidden", "true");
    FIELD.appendChild(el);

    const facing = Math.random() > 0.5 ? "right" : "left";
    return {
      el,
      x: width * 0.35 + Math.random() * Math.max(width * 0.55, 40),
      y: 48 + Math.random() * Math.max(height - 140, 40),
      vx: facing === "right" ? CRUISE : -CRUISE,
      vy: (Math.random() - 0.5) * 0.3,
      facing,
      phase: Math.random() * Math.PI * 2,
      scale: 0.85 + Math.random() * 0.4,
      opacity: 0.48 + Math.random() * 0.28,
    };
  }

  function paint(shark) {
    shark.el.textContent = SPRITES[shark.facing].join("\n");
    shark.el.style.transform = `translate(${shark.x}px, ${shark.y}px) scale(${shark.scale})`;
    shark.el.style.opacity = String(shark.opacity);
  }

  function toFieldCoords(clientX, clientY) {
    const rect = FIELD.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function fleeVector(shark, now) {
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

    const cx = shark.x + 70 * shark.scale;
    const cy = shark.y + 28 * shark.scale;
    const dx = cx - tx;
    const dy = cy - ty;
    const dist = Math.hypot(dx, dy);
    if (dist > radius || dist === 0) return null;
    const force = (1 - dist / radius) * (now < spookUntil ? 3.4 : 2.8);
    return { x: (dx / dist) * force, y: (dy / dist) * force };
  }

  function tick(now) {
    const t = now * 0.001;
    for (const shark of sharks) {
      if (!reducedMotion) {
        const flee = fleeVector(shark, now);
        if (flee) {
          shark.vx += flee.x;
          shark.vy += flee.y;
          shark.opacity = Math.min(0.75, shark.opacity + 0.025);
        } else {
          const cruise = shark.facing === "right" ? CRUISE : -CRUISE;
          shark.vx += (cruise - shark.vx) * 0.02;
          shark.vy += (Math.sin(t + shark.phase) * 0.35 - shark.vy) * 0.03;
          shark.opacity += (0.55 - shark.opacity) * 0.02;
        }

        const speed = Math.hypot(shark.vx, shark.vy);
        if (speed > MAX_SPEED) {
          shark.vx = (shark.vx / speed) * MAX_SPEED;
          shark.vy = (shark.vy / speed) * MAX_SPEED;
        }

        shark.x += shark.vx;
        shark.y += shark.vy;

        if (shark.vx > 0.15) shark.facing = "right";
        else if (shark.vx < -0.15) shark.facing = "left";

        const minX = width * 0.2;
        const maxX = Math.max(width - 170, minX + 20);
        const maxY = Math.max(height - 90, 20);

        if (shark.x < minX - 60) {
          shark.x = minX - 60;
          shark.vx = Math.abs(shark.vx);
          shark.facing = "right";
        } else if (shark.x > maxX + 50) {
          shark.x = maxX + 50;
          shark.vx = -Math.abs(shark.vx);
          shark.facing = "left";
        }
        if (shark.y < 12) {
          shark.y = 12;
          shark.vy = Math.abs(shark.vy);
        } else if (shark.y > maxY) {
          shark.y = maxY;
          shark.vy = -Math.abs(shark.vy);
        }
      }
      paint(shark);
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
  const count = width < 640 ? 4 : 7;
  for (let i = 0; i < count; i++) sharks.push(makeShark());

  HERO.addEventListener("pointermove", onPointer, { passive: true });
  HERO.addEventListener("pointerleave", onLeave);
  window.addEventListener("resize", resize);

  window.spookSharks = () => {
    spookUntil = performance.now() + 1100;
    for (const shark of sharks) {
      const angle = Math.random() * Math.PI * 2;
      shark.vx += Math.cos(angle) * 3;
      shark.vy += Math.sin(angle) * 2.2;
    }
  };

  requestAnimationFrame(tick);
})();
