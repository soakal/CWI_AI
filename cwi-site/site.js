/* CWI — shared site behaviors */
(function () {
  /* ---------- scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + 'ms';
      io.observe(el);
    });
  }

  /* ---------- nav: active link ---------- */
  function initNav() {
    var path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === path) a.classList.add('active');
    });
  }

  /* ---------- year ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- mobile nav ---------- */
  function initMobileNav() {
    var burger = document.querySelector('.nav-burger');
    if (!burger) return;
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('nav-open'); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initReveal(); initNav(); initYear(); initMobileNav();
  });

  /* ============================================================
     DEMO ENGINE — typed call transcript + live chat
     Exposed as window.CWIDemo for the home page.
     ============================================================ */
  window.CWIDemo = function (root) {
    if (!root) return;
    var callScript = [
      { who: 'cwi',   t: "Thanks for calling Lumière Salon, this is Ava. How can I help?" },
      { who: 'caller',t: "Hi, do you have anything for a cut and color this Saturday?" },
      { who: 'cwi',   t: "Let me check… Saturday I have 11:00 AM or 2:30 PM with Renée. Which works?" },
      { who: 'caller',t: "2:30 would be perfect." },
      { who: 'cwi',   t: "Let me check that time for you… 2:30 with Renée looks open. I'll hold it and text you a confirmation once it's locked in — anything else?" },
      { who: 'caller',t: "Nope, that's it. Thank you!" },
      { who: 'cwi',   t: "Perfect — you'll get that confirmation text shortly. See you Saturday! 👋" }
    ];
    var chatScript = [
      { who: 'caller',t: "do you take walk-ins for a beard trim today?" },
      { who: 'cwi',   t: "We're booked solid till 4 — let me check availability… I have 4:45 PM open today. Want me to hold it?" },
      { who: 'caller',t: "yes please" },
      { who: 'cwi',   t: "Great — I'll hold 4:45 PM today under your number and text you a confirmation plus a reminder at 4. See you then!" }
    ];

    var transcript = root.querySelector('[data-transcript]');
    if (!transcript) return;
    var tabs = root.querySelectorAll('[data-tab]');
    var statusEl = root.querySelector('[data-status]');
    var timer = null, mode = 'call';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function bubble(item) {
      var d = document.createElement('div');
      d.className = 'tline ' + (item.who === 'cwi' ? 'is-cwi' : 'is-caller');
      var tag = document.createElement('span');
      tag.className = 'tline-who';
      tag.textContent = item.who === 'cwi' ? 'CWI' : 'Caller';
      var body = document.createElement('p');
      body.textContent = item.t;
      d.appendChild(tag); d.appendChild(body);
      return d;
    }

    // Render every line as the visible base state; stagger them in, then hold & replay.
    function render(script) {
      clearTimeout(timer);
      transcript.innerHTML = '';
      var els = script.map(function (item) {
        var el = bubble(item);
        if (!reduce) el.classList.add('pre');
        transcript.appendChild(el);
        return el;
      });
      if (reduce) { settle(); return; }
      els.forEach(function (el, idx) {
        setTimeout(function () {
          el.classList.remove('pre');
          transcript.scrollTop = transcript.scrollHeight;
          if (idx === els.length - 1) settle();
        }, 360 * idx + 300);
      });
    }
    function settle() {
      transcript.scrollTop = transcript.scrollHeight;
      if (statusEl) statusEl.textContent = mode === 'call' ? 'Call complete · 0:38' : 'Resolved · confirmation sent';
      timer = setTimeout(function () {
        if (statusEl) statusEl.textContent = mode === 'call' ? 'Live call · connected' : 'Live chat · online';
        render(mode === 'call' ? callScript : chatScript);
      }, 5600);
    }

    function start(m) {
      clearTimeout(timer);
      mode = m;
      tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-tab') === m); });
      root.setAttribute('data-mode', m);
      if (statusEl) statusEl.textContent = m === 'call' ? 'Live call · connected' : 'Live chat · online';
      render(m === 'call' ? callScript : chatScript);
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { start(t.getAttribute('data-tab')); });
    });

    // start when scrolled into view (with a guaranteed fallback)
    var started = false;
    function kick() { if (started) return; started = true; start('call'); }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { kick(); io.disconnect(); } });
    }, { threshold: 0.15 });
    io.observe(root);
    setTimeout(kick, 900);
  };
})();

/* ============================================================
   RILEY CHAT WIDGET — scripted interactive demo
   window.CWIRileyChat(el, opts) — embed in any container
   window.CWIRileyFloat()        — floating launcher bottom-right
   ============================================================ */
;(function () {
  'use strict';
  function injectCSS() {
    if (document.getElementById('cwi-riley-css')) return;
    var s = document.createElement('style');
    s.id = 'cwi-riley-css';
    s.textContent =
      '.cwi-launcher{position:fixed;bottom:28px;right:28px;z-index:9990;width:58px;height:58px;border-radius:50%;background:#FF5A1F;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 30px rgba(255,90,31,.45);transition:transform .2s,box-shadow .2s}' +
      '.cwi-launcher:hover{transform:scale(1.07);box-shadow:0 12px 36px rgba(255,90,31,.6)}' +
      '.cwi-panel{position:fixed;bottom:100px;right:28px;z-index:9989;width:360px;max-width:calc(100vw - 32px);background:#0E0E11;border:1px solid rgba(255,255,255,.14);border-radius:24px;box-shadow:0 40px 90px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(16px) scale(.97);pointer-events:none;transition:opacity .25s,transform .25s}' +
      '.cwi-panel.open{opacity:1;transform:none;pointer-events:all}' +
      '.cwi-embed{background:#0E0E11;border:1px solid rgba(255,255,255,.14);border-radius:24px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.5)}' +
      '.cwi-head{display:flex;align-items:center;gap:12px;padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.02)}' +
      '.cwi-head .cwi-mk{width:38px;height:38px;flex:none}' +
      '.cwi-head-name{font-family:Sora,sans-serif;font-weight:700;font-size:15px;color:#F4F4F6;line-height:1.2}' +
      '.cwi-head-sub{font-size:12px;color:#85858E;margin-top:2px;display:flex;align-items:center;gap:6px}' +
      '.cwi-online{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px rgba(74,222,128,.6)}' +
      '.cwi-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth;max-height:310px;min-height:180px}' +
      '.cwi-bub{max-width:88%;font-size:14.5px;line-height:1.5;padding:11px 14px;border-radius:14px;word-break:break-word}' +
      '.cwi-bub.bot{align-self:flex-start;background:rgba(255,90,31,.13);border:1px solid rgba(255,90,31,.22);color:#FFE9DE;border-bottom-left-radius:5px}' +
      '.cwi-bub.usr{align-self:flex-end;background:#191920;border:1px solid rgba(255,255,255,.12);color:#F4F4F6;text-align:right;border-bottom-right-radius:5px}' +
      '.cwi-typing{display:flex;align-items:center;gap:5px;padding:11px 14px;background:rgba(255,90,31,.08);border:1px solid rgba(255,90,31,.18);border-radius:14px;border-bottom-left-radius:5px;align-self:flex-start;width:60px}' +
      '.cwi-typing span{width:7px;height:7px;border-radius:50%;background:#FF5A1F;animation:cwi-dot .8s ease-in-out infinite}' +
      '.cwi-typing span:nth-child(2){animation-delay:.15s}.cwi-typing span:nth-child(3){animation-delay:.3s}' +
      '@keyframes cwi-dot{0%,80%,100%{transform:scale(.7);opacity:.6}40%{transform:scale(1);opacity:1}}' +
      '.cwi-confirm{background:rgba(255,90,31,.1);border:1px solid rgba(255,90,31,.4);border-radius:14px;padding:15px;align-self:flex-start;max-width:88%}' +
      '.cwi-confirm-title{font-family:Sora,sans-serif;font-weight:700;font-size:15px;color:#FF5A1F}' +
      '.cwi-confirm-detail{font-size:13.5px;color:#FFE9DE;margin-top:5px}' +
      '.cwi-confirm-note{font-size:11px;color:rgba(255,233,222,.45);margin-top:6px;font-style:italic}' +
      '.cwi-link-card{display:inline-flex;align-items:center;gap:7px;background:rgba(255,90,31,.12);border:1px solid rgba(255,90,31,.3);color:#FF5A1F;padding:9px 14px;border-radius:10px;font-size:13.5px;font-weight:600;text-decoration:none;margin-top:4px;transition:.15s;align-self:flex-start}' +
      '.cwi-link-card:hover{background:rgba(255,90,31,.24)}' +
      '.cwi-chips{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);background:rgba(0,0,0,.2)}' +
      '.cwi-chip{font-family:"Instrument Sans",sans-serif;font-size:13px;font-weight:600;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#F4F4F6;padding:8px 14px;border-radius:999px;cursor:pointer;transition:.15s;line-height:1.2}' +
      '.cwi-chip:hover{background:rgba(255,90,31,.15);border-color:rgba(255,90,31,.4);color:#fff}' +
      '.cwi-chip:focus{outline:2px solid #FF5A1F;outline-offset:2px}' +
      '.cwi-foot{padding:8px 16px;text-align:center;font-size:11px;color:rgba(255,255,255,.28)}' +
      '@media(max-width:480px){.cwi-panel{right:12px;bottom:88px;width:calc(100vw - 24px)}}' +
      '@media(prefers-reduced-motion:reduce){.cwi-panel,.cwi-launcher{transition:none}}';
    document.head.appendChild(s);
  }

  var MARK = '<svg class="cwi-mk" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="6" y="6" width="108" height="108" rx="30" fill="#0E0E11"/><rect x="6.8" y="6.8" width="106.4" height="106.4" rx="29.2" stroke="rgba(255,255,255,.10)" stroke-width="1.6"/><path d="M41 28 H79 a16 16 0 0 1 16 16 V60 a16 16 0 0 1 -16 16 H55 l-13 12 V76 h-1 a16 16 0 0 1 -16 -16 V44 a16 16 0 0 1 16 -16 Z" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M37 52 H45 L50 43 L55 60 L60 34 L65 60 L70 43 L75 52 H83" fill="none" stroke="#FF5A1F" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var STEPS = {
    greeting:{bot:"Hi! I'm Riley, the CWI AI assistant. What can I help you with today?",chips:[{label:'Book a demo',next:'book-service'},{label:'What are your hours?',next:'hours'},{label:'Get a quote',next:'quote'}]},
    'book-service':{bot:"Great! What service are you looking for? (This is a live demo — pick anything!)",chips:[{label:'AI phone receptionist',next:'book-day',userMsg:'AI phone receptionist setup'},{label:'Website chat assistant',next:'book-day',userMsg:'Website chat assistant'},{label:'Full automation package',next:'book-day',userMsg:'Full automation package'}]},
    'book-day':{bot:"Nice choice! What day works for a quick 15-minute walkthrough?",chips:[{label:'This week',next:'book-time'},{label:'Next week',next:'book-time'},{label:"I'm flexible",next:'book-time',userMsg:"I'm flexible on timing"}]},
    'book-time':{bot:"Morning or afternoon?",chips:[{label:'Morning (9 AM–12)',next:'book-name',userMsg:'Morning works for me'},{label:'Afternoon (1–5 PM)',next:'book-name',userMsg:'Afternoon works for me'}]},
    'book-name':{bot:"Almost done! What's your name and best callback number?",chips:[{label:'Jane Smith · (313) 555-0100',next:'checking',userMsg:'Jane Smith, (313) 555-0100'},{label:'Use my real info',next:'checking',userMsg:'[My details]'}]},
    checking:{bot:"Thanks! The fastest way to lock in a time is to grab a slot on Brian's calendar — pick whatever works for you:",link:{label:'Book on Calendly →',href:'https://calendly.com/cwiai/15min'},chips:[{label:"Have Brian call me instead",next:'requested'},{label:'What does CWI cost?',next:'quote'}]},
    requested:{bot:"Got it — I've passed your details to Brian and he'll reach out within one business day to confirm a time. (This is a demo, so no real booking was made.)",chips:[{label:'What does CWI cost?',next:'quote'},{label:"That's all, thanks!",next:'done'}]},
    hours:{bot:"CWI's team is Mon–Fri, 9 AM–6 PM. But the AI assistants we build run 24/7 — answering your customers while you sleep. Want to see how it works?",chips:[{label:'Yes, show me!',next:'book-service'},{label:'What does it cost?',next:'quote'}]},
    quote:{bot:"Plans start at $197/month (Starter) with a one-time $499 setup. Most clients land on Growth at $397/month, which books jobs and handles follow-up. Go annual and the $499 setup is waived — that's 2 months free plus setup on the house. And it's backed by a 30-day results guarantee, so the risk is on us. Want to talk specifics?",chips:[{label:'Book a consultation',next:'book-service'},{label:'See full pricing',next:'pricing-pg'},{label:'Talk to Brian directly',next:'human'}]},
    'pricing-pg':{bot:"Here's the full pricing breakdown with all plan details:",link:{label:'View Pricing →',href:'pricing.html'},chips:[{label:'Book a demo',next:'book-service'}]},
    human:{bot:"Of course! Reach Brian directly:\n☎️ (734) 812-9971\n✉️ brian@cwiai.net\n\nHe'll get back to you same day.",chips:[{label:'← Start over',next:'greeting'}]},
    done:{bot:"Great! Talk soon. 👋",chips:[{label:'← Start over',next:'greeting'}]}
  };

  function Widget(root, isEmbed) {
    var self = this;
    root.className = isEmbed ? 'cwi-embed' : 'cwi-panel';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Chat with Riley — CWI AI');
    root.innerHTML =
      '<div class="cwi-head">' + MARK +
        '<div><div class="cwi-head-name">Riley · by CWI</div>' +
        '<div class="cwi-head-sub"><span class="cwi-online"></span>Replies instantly</div></div>' +
      '</div>' +
      '<div class="cwi-msgs" role="log" aria-live="polite" aria-label="Chat messages"></div>' +
      '<div class="cwi-chips"></div>' +
      '<div class="cwi-foot">Demo · powered by CWI</div>';
    self.msgs = root.querySelector('.cwi-msgs');
    self.chipsEl = root.querySelector('.cwi-chips');

    self.addBubble = function (text, who) {
      String(text).split('\n').forEach(function (line) {
        if (!line.trim()) return;
        var el = document.createElement('div');
        el.className = 'cwi-bub ' + who;
        el.textContent = line;
        self.msgs.appendChild(el);
      });
      self.msgs.scrollTop = self.msgs.scrollHeight;
    };

    self.addTyping = function () {
      var t = document.createElement('div');
      t.className = 'cwi-typing';
      t.innerHTML = '<span></span><span></span><span></span>';
      self.msgs.appendChild(t);
      self.msgs.scrollTop = self.msgs.scrollHeight;
      return t;
    };

    self.addConfirm = function (c) {
      var el = document.createElement('div');
      el.className = 'cwi-confirm';
      var title = document.createElement('div');
      title.className = 'cwi-confirm-title';
      title.textContent = c.title;
      var detail = document.createElement('div');
      detail.className = 'cwi-confirm-detail';
      detail.textContent = c.detail;
      var note = document.createElement('div');
      note.className = 'cwi-confirm-note';
      note.textContent = c.note;
      el.appendChild(title); el.appendChild(detail); el.appendChild(note);
      self.msgs.appendChild(el);
      self.msgs.scrollTop = self.msgs.scrollHeight;
    };

    self.addLink = function (lk) {
      var a = document.createElement('a');
      a.className = 'cwi-link-card';
      a.href = lk.href;
      a.textContent = lk.label;
      self.msgs.appendChild(a);
      self.msgs.scrollTop = self.msgs.scrollHeight;
    };

    self.renderChips = function (chips) {
      self.chipsEl.innerHTML = '';
      chips.forEach(function (chip) {
        var btn = document.createElement('button');
        btn.className = 'cwi-chip';
        btn.textContent = chip.label;
        btn.addEventListener('click', function () {
          self.chipsEl.innerHTML = '';
          self.addBubble(chip.userMsg || chip.label, 'usr');
          self.goto(chip.next);
        });
        self.chipsEl.appendChild(btn);
      });
    };

    self.goto = function (id) {
      var step = STEPS[id];
      if (!step) return;
      var delay = 650 + Math.floor(Math.random() * 300);
      var typing = self.addTyping();
      setTimeout(function () {
        typing.remove();
        if (step.bot) self.addBubble(step.bot, 'bot');
        if (step.confirmCard) self.addConfirm(step.confirmCard);
        if (step.link) self.addLink(step.link);
        if (step.chips) self.renderChips(step.chips);
      }, delay);
    };

    self.goto('greeting');
  }

  window.CWIRileyChat = function (el, opts) {
    if (!el) return;
    injectCSS();
    new Widget(el, true);
  };

  window.CWIRileyFloat = function () {
    injectCSS();
    var btn = document.createElement('button');
    btn.className = 'cwi-launcher';
    btn.setAttribute('aria-label', 'Chat with Riley · CWI AI');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 4v-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M8 10h8M8 13h5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
    document.body.appendChild(btn);
    var panel = document.createElement('div');
    document.body.appendChild(panel);
    new Widget(panel, false);
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  };
})();
