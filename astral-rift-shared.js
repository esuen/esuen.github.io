/* ============================================================
   Astral Rift — Shared Scripts
   Scroll-reveal observer + rift fractures, used across all pages.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

/* ============================================================
   Lore Navigation — generated from data-current attribute
   ============================================================ */
(function() {
  const nav = document.getElementById('lore-nav');
  if (!nav) return;
  const current = nav.dataset.current;

  const factionLinks = [
    { id: 'foundry', label: 'Foundry', href: 'astral-rift-lore-foundry.html', color: '#4a8eff' },
    { id: 'lattice', label: 'Lattice', href: 'astral-rift-lore-lattice.html', color: '#d4940a' },
    { id: 'choir', label: 'Choir', href: 'astral-rift-lore-choir.html', color: '#e06830' },
    { id: 'fourth', label: 'The Fourth', href: 'astral-rift-lore-fourth.html', color: '#9060e0' },
    { id: 'weave', label: 'The Weave', href: 'astral-rift-lore-weave.html', color: '#30c8c0' },
  ];

  function makeLink(item) {
    if (!item.href || item.id === current) {
      const span = document.createElement('span');
      span.textContent = item.label;
      span.className = item.href ? 'nav-current' : 'nav-disabled';
      if (item.color) span.style.color = item.color;
      return span;
    }
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    a.style.color = item.color;
    return a;
  }

  const factionRow = document.createElement('div');
  factionRow.style.cssText = 'display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;';
  factionLinks.forEach(item => factionRow.appendChild(makeLink(item)));
  nav.appendChild(factionRow);
})();

/* ============================================================
   Rift Fractures — glowing cracks in spacetime
   ============================================================ */
(function() {
  const canvas = document.getElementById('rift-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function fracturePath(x1, y1, x2, y2, displace, depth) {
    if (depth <= 0) return [{x: x1, y: y1}, {x: x2, y: y2}];
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx*dx + dy*dy);
    const nx = -dy/len, ny = dx/len;
    const mx = (x1+x2)/2 + nx * (Math.random()-0.5) * displace;
    const my = (y1+y2)/2 + ny * (Math.random()-0.5) * displace;
    const left = fracturePath(x1, y1, mx, my, displace*0.5, depth-1);
    const right = fracturePath(mx, my, x2, y2, displace*0.5, depth-1);
    return left.concat(right.slice(1));
  }

  class Rift {
    constructor() {
      this.time = 0;
      this.regenTimer = 0;
      this.generate();
    }

    generate() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      const angle = Math.random() * Math.PI * 2;
      const length = 150 + Math.random() * 200;
      const ex = Math.cos(angle) * length;
      const ey = Math.sin(angle) * length;
      this.mainPath = fracturePath(0, 0, ex, ey, 60, 6);
      this.branchPaths = [];
      for (let i = 2; i < this.mainPath.length - 2; i++) {
        if (Math.random() < 0.15) {
          const p = this.mainPath[i];
          const bAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.8);
          const bLen = 30 + Math.random() * 60;
          this.branchPaths.push(fracturePath(p.x, p.y, p.x + Math.cos(bAngle)*bLen, p.y + Math.sin(bAngle)*bLen, 25, 4));
        }
      }
      this.life = 12 + Math.random() * 20;
      this.maxLife = this.life;
    }

    update(dt) {
      this.time += dt * 1000;
      this.life -= dt;
      this.regenTimer += dt;
      if (this.regenTimer > 0.8 + Math.random() * 0.4) {
        this.regenTimer = 0;
        const newBranches = [];
        for (let i = 2; i < this.mainPath.length - 2; i++) {
          if (Math.random() < 0.12) {
            const p = this.mainPath[i];
            const a = Math.random() * Math.PI * 2;
            const l = 20 + Math.random() * 50;
            newBranches.push(fracturePath(p.x, p.y, p.x+Math.cos(a)*l, p.y+Math.sin(a)*l, 20, 3));
          }
        }
        this.branchPaths = newBranches;
      }
      if (this.life <= 0) this.generate();
    }

    draw(ctx) {
      const lifeFrac = this.life / this.maxLife;
      const fade = lifeFrac > 0.9 ? (1-lifeFrac)*10 : lifeFrac < 0.1 ? lifeFrac*10 : 1;
      const pulse = 0.7 + 0.3 * Math.sin(this.time * 0.003);
      const flicker = Math.random() > 0.93 ? 0.3 + Math.random()*0.4 : 1.0;
      const brightness = fade * pulse * flicker;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      this._drawGlow(ctx, this.mainPath, brightness, 1.0);
      for (const bp of this.branchPaths) this._drawGlow(ctx, bp, brightness * 0.5, 0.6);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }

    _drawGlow(ctx, points, brightness, intensity) {
      const t = this.time, j = 1.5;
      // Wide dim outer pass
      ctx.strokeStyle = `rgba(130, 50, 220, ${0.2 * brightness * intensity})`;
      ctx.lineWidth = Math.max(1, 10 * intensity);
      this._stroke(ctx, points, t, j);
      // Mid pass
      ctx.strokeStyle = `rgba(80, 150, 255, ${0.35 * brightness * intensity})`;
      ctx.lineWidth = Math.max(0.5, 4 * intensity);
      this._stroke(ctx, points, t, j * 0.6);
      // Bright core
      ctx.strokeStyle = `rgba(220, 240, 255, ${0.7 * brightness * intensity})`;
      ctx.lineWidth = Math.max(0.3, 1.5 * intensity);
      this._stroke(ctx, points, t, j * 0.3);
    }

    _stroke(ctx, points, time, jAmt) {
      if (points.length < 2) return;
      ctx.beginPath();
      const jx = (i) => (Math.sin(time*0.011+i*7.3)+Math.sin(time*0.023+i*3.1))*jAmt;
      const jy = (i) => (Math.cos(time*0.013+i*5.7)+Math.cos(time*0.019+i*11.3))*jAmt;
      ctx.moveTo(points[0].x + jx(0), points[0].y + jy(0));
      for (let i = 0; i < points.length - 1; i++) {
        const cx = points[i].x + jx(i), cy = points[i].y + jy(i);
        const nx = points[i+1].x + jx(i+1), ny = points[i+1].y + jy(i+1);
        ctx.quadraticCurveTo(cx, cy, (cx+nx)/2, (cy+ny)/2);
      }
      const last = points.length-1;
      ctx.lineTo(points[last].x + jx(last), points[last].y + jy(last));
      ctx.stroke();
    }
  }

  const rifts = [];
  for (let i = 0; i < 3; i++) rifts.push(new Rift());
  let lastTime = performance.now();
  const frameInterval = 1000 / 30; // 30fps cap

  function loop(now) {
    requestAnimationFrame(loop);
    const elapsed = now - lastTime;
    if (elapsed < frameInterval) return;
    const dt = Math.min(elapsed / 1000, 0.05);
    lastTime = now - (elapsed % frameInterval);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const r of rifts) { r.update(dt); r.draw(ctx); }
  }
  requestAnimationFrame(loop);
})();
