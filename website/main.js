/* ═══════════════════════════════════════════════════════════
   Main JS — scroll-reveal and nav background
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  // ── Scroll-reveal ──
  const targets = document.querySelectorAll(
    ".section-tag, .section h2, .lead, .card, .step, .comparison-col, " +
    ".vs-box, .arch-item, .foundations, .foundation-novel, .stack-bar, " +
    ".comparison-conclusion, .hero-content"
  );

  targets.forEach((el) => el.classList.add("reveal"));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((el) => io.observe(el));

  // ── Nav solid on scroll ──
  const nav = document.getElementById("nav");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.style.background =
          window.scrollY > 40
            ? "rgba(5, 11, 16, 0.92)"
            : "rgba(5, 11, 16, 0.75)";
        ticking = false;
      });
      ticking = true;
    }
  });

  // ── Smooth anchor clicks ──
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
})();
