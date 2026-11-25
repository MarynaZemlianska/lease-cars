(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const withTransition = (fn) => {
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(fn);
    else fn();
  };

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.querySelector('.menu_btn');
  const menu = document.querySelector('.menu_list');
  if (menuBtn && menu) {
    const setMenu = (open) => {
      menu.classList.toggle('menu_list--active', open);
      menuBtn.classList.toggle('menu_btn--active', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('no-scroll', open);
    };
    menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('menu_list--active')));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  }

  /* ---------- Tabs (new cars) ---------- */
  const tabItems = document.querySelectorAll('.tabs_btn-item');
  const tabContents = document.querySelectorAll('.tabs_content-item');
  tabItems.forEach((item) => {
    item.addEventListener('click', () => {
      withTransition(() => {
        tabItems.forEach((b) => {
          b.classList.toggle('tabs_btn-item--active', b === item);
          b.setAttribute('aria-selected', String(b === item));
        });
        tabContents.forEach((c) => c.classList.toggle('tabs_content-item--active', c.id === item.dataset.button));
      });
    });
  });

  /* ---------- Filter chips (pre-owned) ---------- */
  const chips = document.querySelectorAll('[data-filter]');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      withTransition(() => {
        chips.forEach((c) => {
          c.classList.toggle('chip--active', c === chip);
          c.setAttribute('aria-pressed', String(c === chip));
        });
        document.querySelectorAll('[data-type]').forEach((card) => {
          const show = filter === 'all' || card.dataset.type.split(' ').includes(filter);
          card.classList.toggle('is-hidden', !show);
        });
      });
    });
  });

  /* ---------- Hero slider ---------- */
  if (window.Swiper && document.querySelector('.swiper')) {
    new Swiper('.swiper', {
      effect: 'fade',
      fadeEffect: { crossFade: true },
      speed: 1200,
      rewind: true,
      autoplay: { delay: 5000, disableOnInteraction: false },
      pagination: { el: '.swiper-pagination', clickable: true },
    });
  }

  /* ---------- Glass header on scroll ---------- */
  const headerMain = document.querySelector('.header-main');
  if (headerMain) {
    const onScroll = () => headerMain.classList.toggle('header--scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Scroll progress (fallback for browsers without scroll timelines) ---------- */
  const progress = document.querySelector('.scroll-progress');
  if (progress && !(window.CSS && CSS.supports('animation-timeline: scroll()'))) {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ---------- Split hero title into animated letters ---------- */
  document.querySelectorAll('[data-split]').forEach((el) => {
    el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
            const word = document.createElement('span');
            word.className = 'word';
            word.setAttribute('aria-hidden', 'true');
            [...part].forEach((ch) => {
              const span = document.createElement('span');
              span.className = 'char';
              span.style.setProperty('--i', i++);
              span.textContent = ch;
              word.append(span);
            });
            frag.append(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------- Reveal on scroll ---------- */
  document.querySelectorAll('[data-stagger]').forEach((group) => {
    [...group.children].forEach((child, idx) => {
      child.classList.add('reveal');
      child.style.setProperty('--d', idx % 4);
    });
  });
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Count-up numbers ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const format = (el, value) => {
    const dec = Number(el.dataset.decimals || 0);
    return (el.dataset.prefix || '') +
      value.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) +
      (el.dataset.suffix || '');
  };
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    if (reduceMotion) { el.textContent = format(el, target); return; }
    const duration = 2200;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = format(el, target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => { el.textContent = format(el, 0); cio.observe(el); });
  }

  /* ---------- 3D tilt + spotlight cards ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
        card.style.setProperty('--rx', `${(0.5 - y) * 10}deg`);
        card.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });

    /* Magnetic buttons */
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Lease vs loan calculator (finance) ---------- */
  const calc = document.querySelector('[data-calc]');
  if (calc) {
    const val = (name) => Number(calc.querySelector(`[name="${name}"]`).value);
    const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
    const out = (key, text) => { const el = document.querySelector(`[data-out="${key}"]`); if (el) el.textContent = text; };
    const LOAN_TERM = 60;
    const update = () => {
      calc.querySelectorAll('output[data-for]').forEach((o) => {
        const v = val(o.dataset.for);
        const fmt = o.dataset.format;
        o.textContent = fmt === 'money' ? money(v) : fmt === 'pct' ? `${v}%` : fmt === 'apr' ? `${v.toFixed(1)}%` : `${v} mo`;
      });
      const price = val('price');
      const down = Math.min(val('down'), price);
      const term = val('term');
      const apr = val('apr');
      const residual = price * val('residual') / 100;
      const cap = price - down;
      const moneyFactor = apr / 2400;
      const lease = Math.max(cap - residual, 0) / term + (cap + residual) * moneyFactor;
      const r = apr / 1200;
      const loan = r ? cap * r / (1 - Math.pow(1 + r, -LOAN_TERM)) : cap / LOAN_TERM;
      out('lease', money(lease));
      out('loan', money(loan));
      out('save', money(Math.max(loan - lease, 0)));
      out('residual', money(residual));
      out('total', money(lease * term + down));
    };
    calc.addEventListener('input', update);
    update();
  }

  /* ---------- "Is leasing right for you?" quiz ---------- */
  const quiz = document.querySelector('[data-quiz]');
  if (quiz) {
    const questions = quiz.querySelectorAll('.quiz_q');
    const result = quiz.querySelector('.quiz_result');
    const answers = new Map();
    questions.forEach((q) => {
      q.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          q.querySelectorAll('button').forEach((b) => {
            b.classList.toggle('chip--active', b === btn);
            b.setAttribute('aria-pressed', String(b === btn));
          });
          answers.set(q, btn.dataset.lease === 'true');
          if (answers.size < questions.length) {
            result.textContent = `Answered ${answers.size} of ${questions.length} questions`;
            return;
          }
          const score = [...answers.values()].filter(Boolean).length;
          result.classList.add('quiz_result--done');
          if (score >= 4) {
            result.innerHTML = 'Leasing looks like a great fit for you! <a href="new-cars.html">Browse lease deals →</a>';
          } else if (score >= 2) {
            result.innerHTML = 'It\'s a close call — compare real numbers in our <a href="finance.html">payment calculator →</a>';
          } else {
            result.innerHTML = 'Buying is probably the better choice for you. <a href="pre-owned-cars.html">See certified pre-owned cars →</a>';
          }
        });
      });
    });
  }

  /* ---------- Contact form ---------- */
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const params = new URLSearchParams(window.location.search);
    const car = params.get('car');
    const topic = params.get('topic');
    const topicSelect = form.querySelector('[name="topic"]');
    if (topic && topicSelect.querySelector(`option[value="${CSS.escape(topic)}"]`)) topicSelect.value = topic;
    if (car) {
      form.querySelector('[name="topic"]').value = 'quote';
      form.querySelector('[name="message"]').value = `Hi! I'm interested in leasing the ${car}. Please send me your best offer.`;
    }
    const status = form.querySelector('.form_status');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      status.textContent = 'Thank you! A leasing specialist will contact you within one business day.';
      form.reset();
    });
  }
})();
