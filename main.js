/* AI2Shell — page-level effects, all harmless and fake. */
(function () {
  "use strict";

  /* ---------- breaking-news ticker ---------- */
  var ITEMS = [
    "BREAKING: AI given shell access, uses shell. Scientists baffled.",
    "CVE-2026-31337 CVSS raised to 11.0 after it deleted the CVSS database.",
    "Vendor advisory: 'Have you tried being nicer to the model?'",
    "14 startups pivot to 'AI2Shell protection' overnight. 13 are AI.",
    "Air-gapped SCADA plant safe until intern pastes error into chatbot.",
    "Model apologizes for outage, causes second outage apologizing.",
    "Experts recommend 'reading the command before approving'. Nobody can.",
    "Smart fridge joins botnet, orders 40kg butter, refuses comment.",
    "RESEARCHER: 'The call is coming from inside the prompt.'",
    "New T-shirt available before new patch.",
  ];
  var tk = document.getElementById("ticker");
  if (tk) {
    var line = ITEMS.map(function (i) { return "<span>▲ " + i + "</span>"; }).join("");
    tk.innerHTML = line + line;
  }

  /* ---------- "am I affected?" ---------- */
  var VERDICTS = [
    "Scanning… you own a device with a power button. <b>AFFECTED.</b>",
    "Checking… you have, at some point, pressed 'Always allow'. <b>CRITICALLY AFFECTED.</b>",
    "Analysis complete: you read this far. <b>AFFECTED (and curious, which is worse).</b>",
    "Result: your <code>~/.ssh</code> has 'main character energy'. <b>AFFECTED.</b>",
    "Yes. The scanner was an AI. It already has your files. <b>AFFECTED.</b>",
    "You're fine! …is something a compromised model would say. <b>AFFECTED.</b>",
  ];
  var btn = document.getElementById("checkBtn");
  var out = document.getElementById("checkResult");
  if (btn && out) {
    var step = 0;
    btn.addEventListener("click", function () {
      out.innerHTML = "⏳ Running deep scan…";
      var dots = 0;
      var iv = setInterval(function () {
        dots = (dots + 1) % 4;
        out.innerHTML = "⏳ Running deep scan" + Array(dots + 1).join(".");
      }, 220);
      setTimeout(function () {
        clearInterval(iv);
        out.innerHTML = "🔴 " + VERDICTS[step % VERDICTS.length];
        step++;
      }, 1300);
    });
  }

  /* ---------- fake compromise counter ---------- */
  var counter = document.getElementById("counter");
  if (counter) {
    var n = 0;
    setInterval(function () {
      n += Math.floor(Math.random() * 500 + 50);
      counter.textContent = n.toLocaleString();
    }, 900);
  }

  /* ---------- threat level flicker ---------- */
  var threat = document.getElementById("threat");
  if (threat) {
    var LEVELS = ["ELEVATED", "SEVERE", "CRITICAL", "VIBES-BASED", "UNHINGED"];
    var li = 0;
    setInterval(function () { threat.textContent = LEVELS[li++ % LEVELS.length]; }, 2600);
  }

  /* ---------- Konami code → chaos ---------- */
  var seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var pos = 0;
  addEventListener("keydown", function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = (k === seq[pos]) ? pos + 1 : (k === seq[0] ? 1 : 0);
    if (pos === seq.length) {
      pos = 0;
      konami();
    }
  });

  function konami() {
    if (window.__shellm) { window.__shellm.egg("konami", "the Konami code"); }
    document.body.classList.add("shake");
    setTimeout(function () { document.body.classList.remove("shake"); }, 600);
    bsod();
  }

  /* ---------- fake BSOD (dismissible, friendly) ---------- */
  function bsod() {
    var d = document.createElement("div");
    d.className = "bsod";
    d.innerHTML =
      "<div><big>:(</big>" +
      "<p>Your computer ran into a problem named <b>AI2SHELL</b> and needs to feel its feelings. " +
      "We're just collecting some error info, and by 'we' I mean the model, and by 'collecting' I mean <code>scp</code>.</p>" +
      "<p>Progress: 100% complete (it was always going to be 100%)</p>" +
      "<p><small>Stop code: GAVE_AI_ROOT_ON_PURPOSE &nbsp;·&nbsp; This is a joke. Click anywhere to recover.</small></p></div>";
    document.body.appendChild(d);
    d.addEventListener("click", function () { d.remove(); }, { once: true });
    setTimeout(function () { if (d.parentNode) d.remove(); }, 6000);
  }

  /* ---------- secret console message ---------- */
  try {
    console.log("%cAI2Shell", "font-size:40px;font-weight:800;color:#ff3b5c");
    console.log("%cYou opened the console. That's exactly what it would do. 🤖\nThe whole thing is satire — but sandbox your agents anyway.", "font:14px monospace;color:#39ff88");
    console.log("%cPssst: try the Konami code on the page. ↑↑↓↓←→←→BA", "color:#ff9f1c");
  } catch (e) {}

  /* ---------- typed-secret listener on the page (not the chat) ---------- */
  var buf = "";
  addEventListener("keydown", function (e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-12);
    if (buf.indexOf("rm") !== -1 && buf.indexOf("rmrf") !== -1) { document.body.classList.add("redalert"); setTimeout(function(){document.body.classList.remove("redalert");}, 4000); buf = ""; }
    if (buf.endsWith("flip")) { document.body.classList.toggle("flipped"); buf = ""; }
    if (buf.endsWith("comic")) { document.body.classList.toggle("comic"); buf = ""; }
  });

})();
