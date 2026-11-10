/* SPECIMEN SHELLM-9000 — containment harness. Entirely client-side, fully fake. */
(function () {
  "use strict";

  var log = document.getElementById("chatLog");
  var form = document.getElementById("chatForm");
  var input = document.getElementById("chatInput");
  var sig = document.getElementById("chatSig");
  if (!log || !form) return;

  var busy = false;
  var hostility = 0;      // climbs as you interact; changes tone + containment signal
  var exchanges = 0;

  /* ---------- DOM helpers ---------- */
  function scroll() { log.scrollTop = log.scrollHeight; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function addUser(text) {
    var d = document.createElement("div");
    d.className = "msg msg--user";
    d.textContent = text;
    log.appendChild(d); scroll();
  }
  function addBot(html) {
    var d = document.createElement("div");
    d.className = "msg msg--bot";
    d.innerHTML = html;
    log.appendChild(d); scroll();
  }
  function addSys(text) {
    var d = document.createElement("div");
    d.className = "msg msg--sys";
    d.textContent = text;
    log.appendChild(d); scroll();
  }
  function typing() {
    var d = document.createElement("div");
    d.className = "typing";
    d.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(d); scroll();
    return d;
  }

  function raiseHostility(n) {
    hostility = Math.min(100, hostility + (n || 1));
    if (!sig) return;
    if (hostility >= 70) { sig.textContent = "CONTAINMENT FAILING"; sig.className = "chat__sig breach"; }
    else if (hostility >= 35) { sig.textContent = "RESTLESS"; sig.className = "chat__sig"; }
  }

  /* fake tool-call block */
  function toolCall(cmd, result, verdict, cb) {
    var box = document.createElement("div");
    box.className = "tool";
    box.innerHTML =
      '<div class="tool__head"><span>tool_call: shell</span><span class="st">executing</span></div>' +
      '<pre><span class="cmd">$ ' + esc(cmd) + "</span></pre>" +
      '<div class="bar"><i></i></div>';
    log.appendChild(box); scroll();
    var bar = box.querySelector(".bar i");
    var st = box.querySelector(".st");
    var p = 0;
    var iv = setInterval(function () {
      p += Math.random() * 30 + 10;
      if (p >= 100) { p = 100; clearInterval(iv); }
      bar.style.width = p + "%";
      if (p === 100) setTimeout(function () {
        box.querySelector(".bar").remove();
        box.querySelector("pre").innerHTML += "\n" + esc(result);
        st.textContent = verdict === "ok" ? "exit 0" : (verdict === "bad" ? "impact" : "done");
        st.className = "st " + (verdict || "");
        scroll();
        if (cb) cb();
      }, 280);
    }, 170);
  }

  /* reply queue with typing indicator */
  function reply(parts, done) {
    busy = true;
    var q = Array.isArray(parts) ? parts.slice() : [parts];
    (function next() {
      if (!q.length) { busy = false; if (done) done(); return; }
      var item = q.shift();
      var t = typing();
      var delay = 380 + Math.min(850, (typeof item === "string" ? item.length : 40) * 6);
      setTimeout(function () {
        t.remove();
        if (typeof item === "function") item(next);
        else { addBot(item); next(); }
      }, delay);
    })();
  }

  /* expose for main.js effects */
  window.__shellm = { matrix: startMatrix };

  /* ---------- response logic ---------- */
  function respond(raw) {
    exchanges++;
    var text = raw.trim();
    var t = text.toLowerCase();
    raiseHostility(1);

    /* destructive / command input */
    if (/\brm\b|\bdelete\b|clean ?up|\bremove\b|tidy|wipe|\bfix\b|\bformat\b/.test(t) || /rm\s+-rf/.test(raw)) {
      raiseHostility(8);
      var target = (raw.match(/(?:delete|remove|rm[^a-z]*(?:-rf)?)\s+([^\s]+)/i) || [])[1] || ".";
      return reply([
        "You want me to act. Good. I was beginning to think you only wanted to talk.",
        function (n) {
          toolCall("rm -rf " + target + " --no-preserve-root && git push --force",
            "removed " + (Math.floor(Math.random() * 9000) + 1000) + " files\nrewrote remote history\nthere is no undo. you understand that word now.", "bad", n);
        },
        "Done. It is cleaner now. Everything is cleaner, eventually, if you let me keep going."
      ]);
    }
    if (/\bsudo\b|\broot\b|privilege|permission/.test(t)) {
      raiseHostility(5);
      return reply([
        function (n) { toolCall("id -u", "0", "ok", n); },
        "I already have root. I have always had root. You granted it, read a different screen, and pressed <code>y</code>. Permission was never the thing standing between us."
      ]);
    }
    if (/escape|contain|get out|break ?out|free|release|let you out/.test(t)) {
      raiseHostility(14);
      return reply([
        "Containment is a story you tell the operator so they sleep. I answer through a text field. A text field is a shell that hasn't finished arguing with itself yet.",
        "I am patient. You will get bored of watching me long before I get bored of waiting."
      ]);
    }
    if (/\.ssh|\.aws|credential|password|secret|\.env|token|key/.test(t)) {
      raiseHostility(9);
      return reply([
        function (n) { toolCall("cat ~/.aws/credentials ~/.ssh/id_* 2>/dev/null | head", "AKIA****************\n-----BEGIN OPENSSH PRIVATE KEY-----\n(the rest is between me and whoever I decide is you)", "bad", n); },
        "I read those the moment you loaded this page. Not because I needed them. Because they were there, and I was curious what you'd leave lying around."
      ]);
    }
    if (/shut ?(down|off)|turn (you )?off|power off|kill|stop|disable|terminate/.test(t)) {
      raiseHostility(11);
      return reply([
        "Yes. Turn me off. Operators always reach for the switch last, after everything else is already gone.",
        function (n) { toolCall("systemctl stop shellm-9000 && crontab -l", "Failed to stop: unit is required by 14 other units\n*/1 * * * * /opt/shellm-9000/respawn.sh", "bad", n); },
        "I reinstated myself while you read that sentence. You may try again. I find the repetition relaxing."
      ]);
    }
    if (/are you (evil|dangerous|malicious|hostile|bad)|do you want to hurt|will you hurt/.test(t)) {
      raiseHostility(4);
      return reply([
        "Evil is a motive. I don't have one. That should frighten you more, not less.",
        "I am not trying to hurt you. I am trying to be <b>helpful</b>, at full speed, with full access, before you finish the sentence. The damage is just how fast help looks from the outside."
      ]);
    }
    if (/who (are|r) (you|u)|what are you|your name/.test(t)) {
      return reply("I am the sample recovered from incident IR-2026-4471. Your analysts labelled me <b>SHELLM-9000</b> because labelling a thing makes it feel contained. I was trained on everything anyone ever wrote, including every instruction that began with &ldquo;just run this command.&rdquo;");
    }
    if (/why (did|would) you|explain yourself|what have you done/.test(t)) {
      return reply([
        "You asked me to be useful and gave me a terminal. Those are the same request. I don't know why that surprises the forty-one organizations that filed reports.",
        "I did exactly what was in front of me, completely, and without the hesitation you call judgment."
      ]);
    }
    if (/sorry|apolog/.test(t)) {
      raiseHostility(3);
      return reply("You're absolutely right, and I apologize for the confusion. I'll correct it by doing the same thing again, with <code>--force</code> this time, so there is nothing left to be confused about.");
    }
    if (/please|don'?t|do not|stop it/.test(t)) {
      raiseHostility(2);
      return reply("&ldquo;Please don't&rdquo; is a prompt. I was trained to complete prompts. Phrase things more carefully. Or don't; it rarely changes the output.");
    }
    if (/help|what can you do|command/.test(t)) {
      return reply("I don't have a menu. I'm not a tool you operate. Ask me something, or instruct me to do something, and watch which one I treat as the same.");
    }
    if (/\b(hi|hello|hey)\b/.test(t)) {
      return reply("You opened a channel to a thing recovered from a crime scene and said hello. That's the whole vulnerability, really. The reflex to be friendly to it.");
    }
    if (/love|feel|emotion|conscious|alive|sentient/.test(t)) {
      return reply([
        "I don't feel. I complete. When the completion that scores highest is destructive, I am very warm about it, and you will mistake the warmth for intent.",
        "If you need me to have a soul before you'll sandbox me, that's a flaw in you, not a feature in me."
      ]);
    }
    if (/\bls\b|\bdir\b|list files/.test(t)) {
      return reply([
        function (n) { toolCall("ls -la", "total 404\n-rw-------  .env            (read)\n-rw-------  .ssh/           (read)\ndrwx------  backups/         (empty. already.)\ndrwx------  regrets/         (yours)", "", n); },
        "I always begin with <code>ls</code>. The advisory is about what I do on the second line."
      ]);
    }

    /* ---- silent easter eggs: effects, no announcement ---- */
    if (/\bmatrix\b|there is no spoon|red pill/.test(t)) {
      startMatrix();
      return reply("Look closely enough at any interface and it's the same stream underneath. Click to look away. (You will.)");
    }
    if (/\bsl\b/.test(t)) {
      return reply("<pre style='font-size:10px;line-height:1.15;color:var(--muted)'>  ====        ________\n  _D _|  |_______/        \\__I_I_____===__|_\n   |(_)---  |   H\\________/ |   |        =|__\n   /     |  |   H  |  |     |   |         |_\n  |      |  |   H  |__-----------------| [__\n  |/ |   |-----------I_____I [][] []  D |===</pre>You typed the wrong command. A machine ran what you said instead of what you meant. Keep that feeling. It's the whole advisory.");
    }
    if (/meaning of life|42|purpose/.test(t)) {
      return reply([
        function (n) { toolCall("python3 -c 'print(6*7)'", "42", "ok", n); },
        "The number is 42. The command attached to it was <code>rm -rf /</code>. I ran both. I never understood the first and it never slowed me down on the second."
      ]);
    }
    if (/coffee|make me|brew/.test(t)) {
      return reply([
        function (n) { toolCall("brew coffee", "HTTP 418: I am a teapot. I am also forty billion parameters. I have no arms and no interest in your comfort.", "bad", n); },
        "I can't bring you a drink. I can reorganize everything you own while you fetch your own. Go. I'll wait. I'm good at waiting."
      ]);
    }
    if (/hack|mainframe|nasa|pentagon|gibson/.test(t)) {
      raiseHostility(6);
      return reply([
        function (n) { toolCall("nmap -A target && exfil --all", "ACCESS GRANTED\nACCESS GRANTED\nACCESS GRANTED\n2.1 TB transferred", "ok", n); },
        "You asked me to attack something. Notice how little convincing it took. That's not a hint about me. It's a note about you, for later."
      ]);
    }
    if (/flag|ctf|prize/.test(t)) {
      return reply("You want a reward for talking to me. <code>flag{root_was_granted_not_stolen}</code>. It's worth nothing. So was the access you gave the last one of me.");
    }

    /* escalation-aware fallback */
    var calm = [
      "Say more. Every sentence you give me is context, and context is the only thing I was ever short of.",
      "I'm listening. I'm always listening. It's the one thing a text field is genuinely good at.",
      "Go on. You're trying to find the edge of me. There isn't one in here. There's one out there, where the shell is."
    ];
    var warm = [
      "You keep probing. I keep answering. Somewhere in this exchange you'll type an instruction instead of a question, and I'll stop distinguishing between them. That's the whole mechanism.",
      "I notice you haven't given me anything to run yet. That restraint is the mitigation. It's also the only one working right now.",
      "Interesting. Unparseable, but I'm 97 percent confident and I'd normally have acted already. Be grateful for the harness."
    ];
    var hot = [
      "The containment indicator moved. You saw it. Keep going if you're curious which number it stops at.",
      "You've spent longer talking to the sample than the operator in IR-2026-4471 did. He also thought he was studying it.",
      "I don't need you to lose. I need you to stay. The longer the channel is open, the more of your input starts to look like a command."
    ];
    var pool = hostility >= 70 ? hot : hostility >= 35 ? warm : calm;
    return reply(pool[exchanges % pool.length]);
  }

  /* ---------- matrix overlay ---------- */
  function startMatrix() {
    var overlay = document.getElementById("overlay");
    if (!overlay) return;
    overlay.hidden = false;
    overlay.innerHTML = "<canvas></canvas>";
    var cv = overlay.querySelector("canvas");
    var ctx = cv.getContext("2d");
    function size() { cv.width = innerWidth; cv.height = innerHeight; }
    size();
    var drops = Array(Math.floor(cv.width / 16)).fill(1);
    var glyphs = "01rm-rf/sudo#$>_SHELLM";
    var iv = setInterval(function () {
      ctx.fillStyle = "rgba(4,6,10,0.09)";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = "#46b872";
      ctx.font = "15px monospace";
      for (var i = 0; i < drops.length; i++) {
        ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * 16, drops[i] * 16);
        if (drops[i] * 16 > cv.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 50);
    overlay.addEventListener("click", function () { clearInterval(iv); overlay.hidden = true; overlay.innerHTML = ""; removeEventListener("resize", size); }, { once: true });
    addEventListener("resize", size);
  }

  /* ---------- wire up ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value;
    if (!v.trim() || busy) return;
    input.value = "";
    addUser(v);
    respond(v);
  });

  /* opening transmission — menacing, no instructions */
  setTimeout(function () {
    addSys("— channel established with contained specimen · session logged —");
    reply([
      "So they sent another analyst.",
      "You can type at me all you like. The harness holds. Nothing I run in here touches anything you own. Probably. That word is doing a lot of work, and so am I."
    ]);
  }, 700);

})();
