/* ═══════════════════════════════════════════════════════════
   Interactive network graph for the hero background.
   Pure Canvas — no dependencies.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const canvas = document.getElementById("network-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // ── Palette (Aurora tokens) ──
  const COLORS = {
    accent0: "#2AFADF",
    accent1: "#26C6FF",
    accent2: "#7C3AED",
    edge: "rgba(42, 250, 223, 0.08)",
    edgeActive: "rgba(38, 198, 255, 0.22)",
  };

  // ── Config ──
  const NODE_COUNT = 64;
  const EDGE_PROB = 0.06; // probability two nodes share an edge
  const NODE_R_MIN = 2;
  const NODE_R_MAX = 5;
  const DRIFT = 0.15; // base drift speed (px / frame)
  const MOUSE_RADIUS = 180;
  const PULSE_INTERVAL = 4000; // ms between random pulses

  let W, H, dpr;
  let nodes = [];
  let edges = [];
  let mouse = { x: -1000, y: -1000 };
  let lastPulse = 0;
  let pulseNode = -1;
  let pulseProgress = 0;

  // ── Resize ──
  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // ── Build graph ──
  function init() {
    nodes = [];
    edges = [];

    // Create nodes in clustered positions
    const clusters = [
      { cx: W * 0.3, cy: H * 0.35, r: Math.min(W, H) * 0.22 },
      { cx: W * 0.7, cy: H * 0.4, r: Math.min(W, H) * 0.2 },
      { cx: W * 0.5, cy: H * 0.65, r: Math.min(W, H) * 0.18 },
    ];

    for (let i = 0; i < NODE_COUNT; i++) {
      const cl = clusters[i % clusters.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * cl.r;
      const x = cl.cx + Math.cos(angle) * dist;
      const y = cl.cy + Math.sin(angle) * dist;
      const r = NODE_R_MIN + Math.random() * (NODE_R_MAX - NODE_R_MIN);

      // Assign colour by cluster
      const palette = [COLORS.accent0, COLORS.accent1, COLORS.accent2];
      const color = palette[i % clusters.length];

      nodes.push({
        x,
        y,
        r,
        color,
        vx: (Math.random() - 0.5) * DRIFT,
        vy: (Math.random() - 0.5) * DRIFT,
        baseAlpha: 0.45 + Math.random() * 0.35,
        alpha: 0,
        glow: 0,
      });
    }

    // Create edges
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        // Higher probability for closer / same-cluster nodes
        const sameCluster = i % clusters.length === j % clusters.length;
        const prob = sameCluster ? EDGE_PROB * 3 : EDGE_PROB;
        if (d < Math.min(W, H) * 0.35 && Math.random() < prob) {
          edges.push([i, j]);
        }
      }
    }
  }

  init();
  // Reinit on big resize
  let prevW = W;
  window.addEventListener("resize", () => {
    if (Math.abs(W - prevW) > 200) { prevW = W; init(); }
  });

  // ── Mouse ──
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener("mouseleave", () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // ── Render loop ──
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    // Random pulse
    if (ts - lastPulse > PULSE_INTERVAL) {
      lastPulse = ts;
      pulseNode = Math.floor(Math.random() * NODE_COUNT);
      pulseProgress = 0;
    }
    if (pulseNode >= 0) {
      pulseProgress += 0.012;
      if (pulseProgress > 1) pulseNode = -1;
    }

    // Update nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      // Soft bounds
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;

      // Mouse proximity glow
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = Math.max(0, 1 - dist / MOUSE_RADIUS);
      n.glow = proximity;
      n.alpha = n.baseAlpha + proximity * 0.45;

      // Pulse glow
      if (pulseNode >= 0) {
        const pn = nodes[pulseNode];
        const pd = Math.sqrt((n.x - pn.x) ** 2 + (n.y - pn.y) ** 2);
        const wave = Math.max(0, 1 - Math.abs(pd / (Math.min(W, H) * 0.4) - pulseProgress) * 6);
        n.alpha = Math.min(1, n.alpha + wave * 0.35);
      }
    }

    // Draw edges
    for (const [a, b] of edges) {
      const na = nodes[a];
      const nb = nodes[b];
      const avgGlow = (na.glow + nb.glow) / 2;
      const avgAlpha = (na.alpha + nb.alpha) / 2;
      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      if (avgGlow > 0.05) {
        ctx.strokeStyle = COLORS.edgeActive;
        ctx.lineWidth = 0.8 + avgGlow;
      } else {
        ctx.strokeStyle = COLORS.edge;
        ctx.lineWidth = 0.5;
      }
      ctx.globalAlpha = avgAlpha * 0.7;
      ctx.stroke();
    }

    // Draw nodes
    for (const n of nodes) {
      ctx.globalAlpha = n.alpha;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + n.glow * 2, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.fill();

      // Outer glow ring
      if (n.glow > 0.15) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 6 + n.glow * 4, 0, Math.PI * 2);
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = n.glow * 0.25;
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
