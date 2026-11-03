// Скрипты сайта TazaNiyet (вынесены из index.html ради строгой политики безопасности CSP)
// APK из EAS Build лежит в выпусках GitHub. Ссылка «latest» всегда ведёт на файл TazaNiyet.apk
// в последнем выпуске — для новой версии достаточно создать новый выпуск с файлом того же имени.
const APK_URL = "https://github.com/SunsetqDev/TazaNiyet/releases/latest/download/TazaNiyet.apk";
const APK_ABS = APK_URL;
document.querySelectorAll(".js-apk").forEach((a) => (a.href = APK_URL));

// QR-код со ссылкой на скачивание
try {
  const qr = qrcode(0, "M");
  qr.addData(APK_ABS);
  qr.make();
  document.getElementById("qr").innerHTML = qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true })
    .replace(/fill="black"/g, 'fill="#153D2C"');
} catch (e) {}

// шапка становится плотной при прокрутке
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("solid", scrollY > 40);
onScroll();
addEventListener("scroll", onScroll, { passive: true });

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

// звёзды
const stars = document.getElementById("stars");
for (let i = 0; i < 46; i++) {
  const s = document.createElement("i");
  s.style.left = Math.random() * 100 + "%";
  s.style.top = Math.random() * 100 + "%";
  s.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
  if (Math.random() > 0.8) s.style.width = s.style.height = "3px";
  stars.appendChild(s);
}

if (!still) {
  // падающие листья
  const leaves = document.getElementById("leaves");
  const colors = ["#c9f36a", "#95c96a", "#f2c94c"];
  for (let i = 0; i < 9; i++) {
    const l = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    l.setAttribute("viewBox", "0 0 20 20");
    l.setAttribute("class", "leaf");
    l.innerHTML = `<path d="M2 18C2 8 8 2 18 2c0 10-6 16-16 16Z" fill="${colors[i % 3]}"/>`;
    l.style.left = Math.random() * 95 + "%";
    l.style.animationDuration = 11 + Math.random() * 10 + "s";
    l.style.animationDelay = -Math.random() * 20 + "s";
    const sz = 12 + Math.random() * 12;
    l.style.width = l.style.height = sz + "px";
    leaves.appendChild(l);
  }

  // лёгкий параллакс слоёв пейзажа
  const layers = [...document.querySelectorAll(".layer")];
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(scrollY, innerHeight);
      layers.forEach((g) => g.setAttribute("transform", `translate(0 ${(y * g.dataset.depth).toFixed(1)})`));
      ticking = false;
    });
  }, { passive: true });
}

if (!still) {
  // заголовок: слова появляются по очереди
  const h1 = document.querySelector(".hero h1");
  let k = 0;
  const wrapWords = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w.trim()) return frag.append(w);
          const sp = document.createElement("span");
          sp.className = "h1-word";
          sp.style.setProperty("--d", (0.3 + k++ * 0.08).toFixed(2) + "s");
          sp.textContent = w;
          frag.append(sp);
        });
        n.replaceWith(frag);
      } else wrapWords(n);
    });
  };
  wrapWords(h1);

  // очки на экране телефона считаются от нуля
  document.querySelectorAll(".count").forEach((el) => {
    const to = +el.dataset.to;
    el.textContent = "0";
    setTimeout(() => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1600);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 1400);
  });

  // подсветка карточек за курсором
  document.querySelectorAll(".feat").forEach((c) =>
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px");
      c.style.setProperty("--my", e.clientY - r.top + "px");
    })
  );
}

// порядковые номера для поочерёдного появления
[".steps", ".features", ".ranks", ".safe-list", ".faq", ".install"].forEach((sel) =>
  document.querySelectorAll(sel).forEach((box) => [...box.children].forEach((el, i) => el.style.setProperty("--i", i)))
);
document.querySelector(".ranks").classList.add("reveal");

// полоса прокрутки
const bar = document.getElementById("progress");
addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = "scaleX(" + (max > 0 ? scrollY / max : 0) + ")";
}, { passive: true });

// появление блоков при прокрутке
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
