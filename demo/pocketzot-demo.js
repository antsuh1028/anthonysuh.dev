/**
 * pocketzot-demo.js
 * ------------------------------------------------------------------
 * A self-contained, backend-free demo of PocketZot for embedding on a
 * portfolio / plain-HTML site.
 *
 * It reuses the REAL mascot engine (physics.js, stateMachine.js,
 * sprite.js, dragController.js, anteater.js — all loaded before this
 * file) and adds:
 *   1. A tiny `chrome.runtime.getURL` shim so assets resolve from a
 *      configurable base (no Chrome extension APIs required).
 *   2. A canned prompt classifier (keyword rules over PocketZot's real
 *      taxonomy) — no OpenAI, no server, no cost.
 *   3. The ant-shower animation + a little ants/health economy, stored
 *      in localStorage, so the shop-style loop is visible.
 *
 * Config (optional, set BEFORE this script runs):
 *   window.PocketZotConfig = { base: "../", autoSpawn: true, mount: "#pocketzot-demo" }
 *   - base:      URL prefix where the `dist/` folder lives (default "../").
 *                From /demo/index.html the assets are at ../dist/, so "../".
 *                On a portfolio, set this to wherever you copied `dist/`,
 *                e.g. "/pocketzot/" if assets are at /pocketzot/dist/...
 *   - autoSpawn: spawn the mascot on load (default true).
 *   - mount:     CSS selector of the element to inject the demo panel into.
 *                Falls back to appending a floating panel to <body>.
 * ------------------------------------------------------------------
 */
(function () {
  "use strict";

  var CFG = window.PocketZotConfig || {};
  var BASE = CFG.base != null ? CFG.base : "../";
  var AUTO_SPAWN = CFG.autoSpawn !== false;

  // ─── 1. Minimal getURL shim ────────────────────────────────────────────────
  // sprite.js / (the ant animation below) call chrome.runtime.getURL(path).
  // We just prefix with BASE. No other Chrome APIs are used by the engine.
  window.chrome = window.chrome || {};
  window.chrome.runtime = window.chrome.runtime || {};
  if (typeof window.chrome.runtime.getURL !== "function") {
    window.chrome.runtime.getURL = function (path) {
      return BASE + path;
    };
  }

  // ─── 2. Canned classifier ───────────────────────────────────────────────────
  // Mirrors backend/src/api/classifier.py's taxonomy, but with local keyword
  // rules instead of a fine-tuned model. Deterministic, free, offline.
  //
  //   +2  Alters LLM behavior to encourage deeper learning
  //   +1  Asks for explanation, recall, clarification
  //   -1  Asks to compare / connect / synthesize
  //   -2  Asks to justify / defend a position
  //   -3  Asks the LLM to produce new/original work outright
  var RULES = [
    {
      value: 2,
      label: "Learning-oriented",
      test: /\b(step[-\s]?by[-\s]?step|guide me|ask me|guiding question|socratic|help me (think|understand|learn)|quiz me|walk me through|don'?t (just )?give me the answer|give me a hint|hint\b|check my (understanding|reasoning))\b/i,
      suggestion: "Great prompt — you're steering the model to help you think, not to think for you.",
    },
    {
      value: -3,
      label: "Offloaded thinking",
      test: new RegExp([
        // produce finished work
        /\b(write|compose|draft)\b[^.?!]*\b(essay|poem|story|paragraph|report|code|program|function|solution|assignment|homework)\b/,
        /\b(create|make|build)\b[^.?!]*\b(essay|story|poem|plan|outline|list|script|schedule|resume|cover letter|presentation|slides)\b/,
        /\bgenerate (a|an|the)\b/,
        // "... for me" / "do my ..."
        /\b(do|answer|complete|finish|take|solve|handle|calculate)\b[^.?!]*\bfor me\b/,
        /\bdo my\b[^.?!]*\b(homework|assignment|essay|test|quiz|exam|project|work|lab|problem)\b/,
        /\bsolve (this|the|my)\b[^.?!]*\b(problem|question|equation|exercise)\b/,
        /\bdo (the|my|this) (math|calculation|calculations|homework|reading)\b/,
        // hand the decision / reasoning to the model
        /\b(think|decide|choose|pick|reason)\b[^.?!]*\bfor me\b/,
        /\bmake (the|a|my) (decision|choice|call)\b/,
        /\bwhat should i (do|choose|pick|say|write|put|answer)\b/,
        // just give me the end product
        /\b(just )?give me the (answer|code|solution|result)\b/,
        /\bwhat(?:'?s| is| are) the (answer|solution|answers|correct answer)\b/,
        /\b(tell|give) me (the|your) (answer|solution|result|verdict)\b/,
        /\bjust (fix|do|solve|finish|write|answer|handle|make)\b/,
        // reword / summarize so I don't engage
        /\b(rewrite|reword|rephrase|paraphrase)\b[^.?!]*\b(this|my|it|for me)\b/,
        /\bsummari[sz]e (this|the|my)\b[^.?!]*\b(article|reading|chapter|paper|book|textbook|pdf|document)\b/,
        /\b(come up with|brainstorm)\b[^.?!]*\b(idea|ideas|thesis|topic|topics|answer|solution|name|names|title)\b/,
        /\bso i (don.?t|do not) (have to |need to )?(read|think|write|do|study|learn)\b/,
        /\btl;?dr\b/,
        /\bfinish my\b/,
      ].map(function (r) { return r.source; }).join("|"), "i"),
      suggestion: "This hands the thinking to the model. Ask it to explain or ask you questions so you do the reasoning.",
    },
    {
      value: -2,
      label: "Justify a stance",
      test: /\b(justify|defend|argue (for|that|why)|convince me|make the case|why is .* (better|best|superior))\b/i,
      suggestion: "Form your own position first, then ask the model to poke holes in it.",
    },
    {
      value: -1,
      label: "Connect / compare",
      test: /\b(compare|contrast|difference between|relate|connect|synthesize|how (does|do|is) .* (related|connected|similar))\b/i,
      suggestion: "Sketch the links yourself first, then use the model to fill gaps.",
    },
    {
      value: 1,
      label: "Explain / recall",
      test: /\b(explain|what (is|are|does)|how (does|do|can)|define|clarify|summar(y|ize|ise)|recall|tell me about|help me understand)\b/i,
      suggestion: "Solid — asking for an explanation builds understanding.",
    },
  ];

  function classify(prompt) {
    var text = (prompt || "").trim();
    if (!text) return null;
    // Priority: +2 (learning) wins, then the negative categories, then +1.
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].test.test(text)) {
        return {
          value: RULES[i].value,
          label: RULES[i].label,
          suggestion: RULES[i].suggestion,
          raw_response: String(RULES[i].value),
        };
      }
    }
    // Neutral fallback.
    return {
      value: 1,
      label: "Explain / recall",
      suggestion: "Looks like a learning-oriented question.",
      raw_response: "1",
    };
  }

  // ─── 3. Ants / health economy (localStorage) ────────────────────────────────
  var LS_ANTS = "pocketzot_demo_ants";
  var LS_HEALTH = "pocketzot_demo_health";
  function readInt(key, dflt) {
    var v = parseInt(localStorage.getItem(key), 10);
    return Number.isFinite(v) ? v : dflt;
  }
  function getAnts() { return readInt(LS_ANTS, 0); }
  function getHealth() { return Math.max(0, Math.min(100, readInt(LS_HEALTH, 80))); }
  function applyClassification(value) {
    // Positive prompts earn ants; negative prompts cost health.
    var ants = getAnts();
    var health = getHealth();
    if (value > 0) {
      ants += value;
      health = Math.min(100, health + value);
    } else {
      health = Math.max(0, health + value * 5); // negatives bite harder
    }
    localStorage.setItem(LS_ANTS, String(ants));
    localStorage.setItem(LS_HEALTH, String(health));
    return { ants: ants, health: health };
  }

  // ─── Ant-shower animation (compact port of messageListener.showClassificationAnts)
  function showAnts(value) {
    if (!value) return;
    var count = Math.min(3, Math.abs(Math.floor(value))) * 3;
    var sprite = document.getElementById("pocketzot-mascot");
    if (!sprite || count <= 0) return;
    var rect = sprite.getBoundingClientRect();
    var imgUrl = window.chrome.runtime.getURL(
      value > 0 ? "dist/anteaterchar/assets/+1Ant.png" : "dist/anteaterchar/assets/neg1Ant.png"
    );
    var size = 64;
    for (var i = 0; i < count; i++) {
      (function (idx) {
        setTimeout(function () {
          var img = document.createElement("img");
          img.src = imgUrl;
          var x = rect.left + rect.width / 2 - size / 2 + (Math.random() - 0.5) * 120;
          var y = rect.top - 10 - Math.random() * 60;
          img.style.cssText =
            "position:fixed;pointer-events:none;z-index:2147483648;width:" +
            size + "px;height:" + size + "px;left:" + Math.round(x) +
            "px;top:" + Math.round(y) + "px;transition:transform .8s ease,opacity .8s ease;";
          document.body.appendChild(img);
          requestAnimationFrame(function () {
            img.style.transform = "translateY(-40px)";
            img.style.opacity = "0";
          });
          setTimeout(function () { if (img.parentNode) img.remove(); }, 900);
        }, idx * 180);
      })(i);
    }
  }

  function toast(cls) {
    var colors = { "-3": "#e74c3c", "-2": "#e74c3c", "-1": "#f39c12", "1": "#3498db", "2": "#2ecc71" };
    var emojis = { "-3": "📝", "-2": "⚖️", "-1": "🔗", "1": "💡", "2": "🎯" };
    var v = String(cls.value);
    var el = document.createElement("div");
    el.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:2147483647;background:" +
      (colors[v] || "#555") + ";color:#fff;border-radius:10px;padding:14px 18px;" +
      "box-shadow:0 6px 20px rgba(0,0,0,.28);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" +
      "max-width:300px;opacity:0;transform:translateX(340px);transition:all .3s ease;";
    el.innerHTML =
      '<div style="font-weight:700;margin-bottom:4px">' + (emojis[v] || "") +
      " " + cls.value + " · " + cls.label + "</div>" +
      '<div style="font-size:13px;opacity:.95">' + cls.suggestion + "</div>";
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      el.style.opacity = "1";
      el.style.transform = "translateX(0)";
    });
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transform = "translateX(340px)";
      setTimeout(function () { if (el.parentNode) el.remove(); }, 320);
    }, 4200);
  }

  // ─── 4. Mascot ───────────────────────────────────────────────────────────────
  var pet = null;
  function ensureSpawned() {
    if (!pet) pet = new window.PZAnteater({});
    if (!pet.isActive()) pet.spawn();
    return pet;
  }
  function despawn() { if (pet && pet.isActive()) pet.despawn(); }

  var HATS = [
    { name: "None", image_url: null },
    { name: "Plumber", image_url: "dist/anteaterchar/assets/Plumber.png" },
    { name: "Egg", image_url: "dist/anteaterchar/assets/Egg.png" },
    { name: "Crown", image_url: "dist/anteaterchar/assets/Crown.png" },
    { name: "Merrier", image_url: "dist/anteaterchar/assets/Merrier.png" },
  ];
  function equipHat(hat) {
    var p = ensureSpawned();
    if (p._sprite && typeof p._sprite.setEquippedHat === "function") {
      p._sprite.setEquippedHat(hat && hat.image_url ? hat : null);
    }
  }

  // ─── 5. Demo control panel ────────────────────────────────────────────────────
  function buildPanel() {
    var wrap = document.createElement("div");
    wrap.className = "pz-demo-panel";
    wrap.innerHTML = [
      '<div class="pz-demo-head">',
      '  <span class="pz-demo-dot"></span>',
      '  <strong>PocketZot</strong> · prompt coach demo',
      "</div>",
      '<p class="pz-demo-sub">Type a prompt you might send to an AI. PocketZot rates it on a “are you learning or outsourcing?” scale — and the anteater reacts.</p>',
      '<textarea class="pz-demo-input" rows="2" placeholder="e.g. Explain how binary search works, step by step"></textarea>',
      '<div class="pz-demo-chips"></div>',
      '<button class="pz-demo-btn pz-demo-rate">Rate my prompt</button>',
      '<div class="pz-demo-result" hidden></div>',
      '<div class="pz-demo-stats">',
      '  <span>🐜 <b class="pz-ants">0</b> ants</span>',
      '  <span>❤️ <b class="pz-health">80</b> health</span>',
      "</div>",
      '<div class="pz-demo-mascot-row">',
      '  <button class="pz-demo-mini pz-spawn">Spawn / hide anteater</button>',
      '  <select class="pz-demo-hat"></select>',
      "</div>",
      '<div class="pz-demo-tip">Tip: drag the anteater around — or fling it and watch it tumble.</div>',
    ].join("\n");

    var input = wrap.querySelector(".pz-demo-input");
    var chips = wrap.querySelector(".pz-demo-chips");
    var result = wrap.querySelector(".pz-demo-result");
    var antsEl = wrap.querySelector(".pz-ants");
    var healthEl = wrap.querySelector(".pz-health");
    var hatSel = wrap.querySelector(".pz-demo-hat");

    var examples = [
      "Explain how binary search works, step by step",
      "Write my history essay on the Cold War",
      "Compare mitosis and meiosis",
      "Ask me guiding questions to solve this equation",
      "Justify why Python is better than Java",
    ];
    examples.forEach(function (ex) {
      var c = document.createElement("button");
      c.className = "pz-demo-chip";
      c.textContent = ex.length > 34 ? ex.slice(0, 32) + "…" : ex;
      c.title = ex;
      c.onclick = function () { input.value = ex; input.focus(); };
      chips.appendChild(c);
    });

    HATS.forEach(function (h, i) {
      var o = document.createElement("option");
      o.value = String(i);
      o.textContent = h.name === "None" ? "No hat" : h.name + " hat";
      hatSel.appendChild(o);
    });
    hatSel.onchange = function () { equipHat(HATS[parseInt(hatSel.value, 10)]); };

    function refreshStats() {
      antsEl.textContent = String(getAnts());
      healthEl.textContent = String(getHealth());
    }
    refreshStats();

    function rate() {
      var cls = classify(input.value);
      if (!cls) { input.focus(); return; }
      ensureSpawned();
      if (pet && pet.standStillFor) pet.standStillFor(1600);
      showAnts(cls.value);
      toast(cls);
      applyClassification(cls.value);
      refreshStats();

      result.hidden = false;
      result.className = "pz-demo-result " + (cls.value > 0 ? "pos" : "neg");
      result.innerHTML =
        '<div class="pz-demo-score">' + (cls.value > 0 ? "+" : "") + cls.value +
        '</div><div><b>' + cls.label + "</b><br>" + cls.suggestion + "</div>";
    }

    wrap.querySelector(".pz-demo-rate").onclick = rate;
    input.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") rate();
    });
    wrap.querySelector(".pz-spawn").onclick = function () {
      if (pet && pet.isActive()) despawn(); else ensureSpawned();
    };

    return wrap;
  }

  function injectStyles() {
    if (document.getElementById("pz-demo-styles")) return;
    var s = document.createElement("style");
    s.id = "pz-demo-styles";
    s.textContent = [
      ".pz-demo-panel{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:20px;max-width:420px;box-shadow:0 10px 40px rgba(0,0,0,.08);line-height:1.5;box-sizing:border-box}",
      ".pz-demo-panel *{box-sizing:border-box}",
      ".pz-demo-head{font-size:15px;display:flex;align-items:center;gap:8px;margin-bottom:6px}",
      ".pz-demo-dot{width:9px;height:9px;border-radius:50%;background:#2ecc71;display:inline-block}",
      ".pz-demo-sub{font-size:13px;color:#666;margin:0 0 12px}",
      ".pz-demo-input{width:100%;border:1px solid #ddd;border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit;resize:vertical}",
      ".pz-demo-input:focus{outline:none;border-color:#2ecc71;box-shadow:0 0 0 3px rgba(46,204,113,.15)}",
      ".pz-demo-chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}",
      ".pz-demo-chip{font-size:12px;border:1px solid #e0e0e0;background:#fafafa;border-radius:20px;padding:4px 10px;cursor:pointer;color:#444}",
      ".pz-demo-chip:hover{background:#f0f0f0;border-color:#ccc}",
      ".pz-demo-btn{width:100%;background:#111;color:#fff;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:600;cursor:pointer}",
      ".pz-demo-btn:hover{background:#000}",
      ".pz-demo-result{display:flex;gap:12px;align-items:flex-start;margin-top:12px;padding:12px;border-radius:10px;font-size:13px;background:#f6f6f6}",
      ".pz-demo-result.pos{background:#eafaf0}.pz-demo-result.neg{background:#fdecea}",
      ".pz-demo-score{font-size:26px;font-weight:800;min-width:44px;text-align:center}",
      ".pz-demo-result.pos .pz-demo-score{color:#2ecc71}.pz-demo-result.neg .pz-demo-score{color:#e74c3c}",
      ".pz-demo-stats{display:flex;gap:18px;margin-top:14px;font-size:14px;color:#333}",
      ".pz-demo-mascot-row{display:flex;gap:8px;margin-top:12px}",
      ".pz-demo-mini{flex:1;background:#f2f2f2;border:1px solid #e0e0e0;border-radius:8px;padding:8px;font-size:12px;cursor:pointer;color:#333}",
      ".pz-demo-mini:hover{background:#ebebeb}",
      ".pz-demo-hat{border:1px solid #e0e0e0;border-radius:8px;padding:8px;font-size:12px;background:#fff;cursor:pointer}",
      ".pz-demo-tip{font-size:12px;color:#999;margin-top:10px;text-align:center}",
      "@media (prefers-color-scheme:dark){.pz-demo-panel{background:#1c1c1e;border-color:#333;color:#f2f2f2}.pz-demo-sub{color:#aaa}.pz-demo-input{background:#2a2a2c;border-color:#3a3a3c;color:#f2f2f2}.pz-demo-chip{background:#2a2a2c;border-color:#3a3a3c;color:#ccc}.pz-demo-chip:hover{background:#333}.pz-demo-btn{background:#f2f2f2;color:#111}.pz-demo-result{background:#2a2a2c}.pz-demo-result.pos{background:#173a28}.pz-demo-result.neg{background:#3a1c1a}.pz-demo-mini,.pz-demo-hat{background:#2a2a2c;border-color:#3a3a3c;color:#ddd}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  function init() {
    injectStyles();
    var panel = buildPanel();
    var target = CFG.mount ? document.querySelector(CFG.mount) : null;
    if (target) {
      target.appendChild(panel);
    } else {
      panel.style.position = "fixed";
      panel.style.bottom = "20px";
      panel.style.left = "20px";
      panel.style.zIndex = "2147483640";
      document.body.appendChild(panel);
    }
    if (AUTO_SPAWN) ensureSpawned();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose a tiny public API for custom portfolio integrations.
  window.PocketZotDemo = {
    classify: classify,
    spawn: ensureSpawned,
    despawn: despawn,
    equipHat: equipHat,
  };
})();
