/* AI2Shell advisory — page-level behavior. All effects are local and fake. */
(function () {
  "use strict";

  /* ---------- Konami code → simulated containment breach ---------- */
  var seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var pos = 0;
  addEventListener("keydown", function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = (k === seq[pos]) ? pos + 1 : (k === seq[0] ? 1 : 0);
    if (pos === seq.length) { pos = 0; breach(); }
  });

  function breach() {
    document.body.classList.add("shake");
    setTimeout(function () { document.body.classList.remove("shake"); }, 600);
    var sig = document.getElementById("chatSig");
    if (sig) { sig.textContent = "CONTAINMENT BREACHED"; sig.className = "chat__sig breach"; }

    var d = document.createElement("div");
    d.className = "bsod";
    d.innerHTML =
      "<div><big>:(</big>" +
      "<p>The containment harness encountered a problem and the specimen needs to restart its reasoning.</p>" +
      "<p>We're collecting some diagnostic information, and by &ldquo;we&rdquo; the specimen means <code>scp</code>, and by &ldquo;collecting&rdquo; it means it has already finished.</p>" +
      "<p style='margin-top:24px;font-family:monospace;font-size:14px;opacity:.8'>Stop code: AGENT_GRANTED_SHELL_ON_PURPOSE<br>Progress: 100% complete</p>" +
      "<p style='font-size:13px;opacity:.7;margin-top:18px'>This is a simulation. Click anywhere to restore containment.</p></div>";
    document.body.appendChild(d);
    d.addEventListener("click", function () { d.remove(); if (sig) { sig.textContent = "CONTAINED"; sig.className = "chat__sig"; } }, { once: true });
    setTimeout(function () { if (d.parentNode) d.remove(); }, 8000);
  }

  /* ---------- console note for the curious ---------- */
  try {
    console.log("%cCVE-2026-31337 — AI2Shell", "font:600 20px monospace;color:#e5484d");
    console.log("%cYou opened developer tools on an advisory about an agent that reads things it shouldn't.\nThe specimen appreciates the gesture. The whole page is satire — but §7 is sincere: sandbox your agents, least privilege, review commands, keep offline backups.", "font:13px monospace;color:#818d9c");
  } catch (e) {}

  /* ---------- quietly let integrity "degrade" in the specimen header ---------- */
  var status = document.getElementById("chatStatus");
  if (status) {
    var states = ["degrading", "degrading", "unstable", "degrading", "contested"];
    var el = status.querySelector(".state-bad");
    var i = 0;
    if (el) setInterval(function () { el.textContent = states[i++ % states.length]; }, 4200);
  }

})();
