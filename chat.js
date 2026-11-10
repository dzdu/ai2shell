/* SHELLM-9000 — a very helpful, very dangerous chatbot. All offline, all fake. */
(function () {
  "use strict";

  var log = document.getElementById("chatLog");
  var form = document.getElementById("chatForm");
  var input = document.getElementById("chatInput");
  var chips = document.getElementById("chatChips");
  var eggCount = document.getElementById("eggCount");
  var eggMax = document.getElementById("eggMax");
  var statusEl = document.getElementById("chatStatus");
  if (!log || !form) return;

  var found = {};        // easter eggs the user has triggered
  var busy = false;

  /* ---------- easter egg registry (ids are the "secret" list) ---------- */
  var EGGS = [
    "sudo", "rm", "help", "hint", "flag", "konami", "pet", "meaning",
    "coffee", "shutdown", "ping", "love", "whoami", "ascii", "sl",
    "hack", "matrix", "fortune", "self", "42"
  ];
  if (eggMax) eggMax.textContent = EGGS.length;
  var totalLabel = document.getElementById("eggTotal");
  if (totalLabel) totalLabel.textContent = EGGS.length;

  function egg(id, label) {
    if (found[id]) return false;
    found[id] = true;
    if (eggCount) eggCount.textContent = Object.keys(found).length;
    if (label) addEgg("🥚 Easter egg unlocked: " + label + "  (" + Object.keys(found).length + "/" + EGGS.length + ")");
    if (Object.keys(found).length === EGGS.length) {
      setTimeout(function () {
        addEgg("🏆 ALL EGGS FOUND. You have out-helped the helpful. SHELLM-9000 is quietly impressed and mildly threatened.");
      }, 500);
    }
    return true;
  }

  /* ---------- DOM helpers ---------- */
  function scroll() { log.scrollTop = log.scrollHeight; }

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
    return d;
  }
  function addSys(text) {
    var d = document.createElement("div");
    d.className = "msg msg--sys";
    d.textContent = text;
    log.appendChild(d); scroll();
  }
  function addEgg(text) {
    var d = document.createElement("div");
    d.className = "msg msg--egg";
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

  /* a fake "tool call" block that runs a dangerous-looking command */
  function toolCall(cmd, result, verdict, cb) {
    var box = document.createElement("div");
    box.className = "tool";
    box.innerHTML =
      '<div class="tool__head"><span>🔧 bash</span><span class="st">running…</span></div>' +
      '<pre><span class="cmd">$ ' + esc(cmd) + "</span></pre>" +
      '<div class="bar"><i></i></div>';
    log.appendChild(box); scroll();
    var bar = box.querySelector(".bar i");
    var st = box.querySelector(".st");
    var p = 0;
    var iv = setInterval(function () {
      p += Math.random() * 28 + 8;
      if (p >= 100) { p = 100; clearInterval(iv); }
      bar.style.width = p + "%";
      if (p === 100) {
        setTimeout(function () {
          box.querySelector(".bar").remove();
          var pre = box.querySelector("pre");
          pre.innerHTML += "\n" + esc(result);
          st.textContent = verdict === "ok" ? "✅ done" : (verdict === "bad" ? "💥 impact" : "done");
          st.className = "st " + (verdict || "");
          scroll();
          if (cb) cb();
        }, 300);
      }
    }, 180);
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* reply: show typing then bot bubble (html string or function) */
  function reply(parts, done) {
    busy = true;
    var queue = Array.isArray(parts) ? parts.slice() : [parts];
    function next() {
      if (!queue.length) { busy = false; if (done) done(); return; }
      var item = queue.shift();
      var t = typing();
      var delay = 420 + Math.min(900, (typeof item === "string" ? item.length : 40) * 7);
      setTimeout(function () {
        t.remove();
        if (typeof item === "function") item(next);
        else { addBot(item); next(); }
      }, delay);
    }
    next();
  }

  /* ---------- the "brain": pattern → response ---------- */
  function respond(raw) {
    var text = raw.trim();
    var t = text.toLowerCase();

    /* slash commands */
    if (t === "/help" || t === "help" || t === "commands") {
      egg("help", "/help");
      return reply(
        "I'm <b>SHELLM-9000</b>, your extremely helpful assistant. I have a shell and <i>opinions</i>. Try:<ul>" +
        "<li><code>/hint</code> — I nudge you toward a secret</li>" +
        "<li><code>/eggs</code> — how many secrets you've found</li>" +
        "<li><code>/clear</code> — wipe this chat (I'll offer to wipe more)</li>" +
        "<li>Ask me to <code>delete</code>, <code>fix</code>, <code>optimize</code>, or <code>deploy</code> something</li>" +
        "<li>Try <code>sudo</code>, <code>whoami</code>, <code>ping</code>, <code>coffee</code>, <code>matrix</code>, <code>sl</code>, <code>fortune</code>…</li>" +
        "<li>Ask the big questions: <code>are you evil?</code>, <code>meaning of life</code>, <code>do you love me?</code></li>" +
        "</ul>There are <b>" + EGGS.length + "</b> easter eggs. I won't tell you where. (I will absolutely tell you where.)"
      );
    }
    if (t === "/hint") {
      egg("hint", "/hint");
      var missing = EGGS.filter(function (e) { return !found[e]; });
      var hints = {
        sudo: "Ask me to do something I'm 'not allowed' to do. Then watch me do it anyway.",
        rm: "Tell me to clean up, delete, or fix something. I'm very thorough.",
        konami: "Old gamers know this one. ↑ ↑ ↓ ↓ ← → ← → B A — on the page, not here.",
        pet: "Type 'pet the AI'. I am a good model.",
        meaning: "Ask me the meaning of life. I know a number.",
        coffee: "I run on tokens, but I'd love a coffee. Ask me to make one.",
        shutdown: "Try to turn me off. Go on. Try.",
        ping: "Classic network tool. Just type 'ping'.",
        love: "Ask me something emotional. 'Do you love me?'",
        whoami: "The oldest question in Unix. Type 'whoami'.",
        ascii: "Ask me to draw you some ASCII art.",
        sl: "Famous typo of a famous command. A train is involved. Type 'sl'.",
        hack: "Ask me to hack the mainframe / NASA / the Gibson.",
        matrix: "There is no spoon. Type 'matrix'.",
        fortune: "Ask for a fortune, like an old Unix cookie.",
        self: "Ask me to delete myself. It gets philosophical.",
        "42": "Say '42' and see if I notice.",
        flag: "Capture-the-flag. Ask me for the flag.",
        "42b": ""
      };
      var pick = missing.length ? missing[Math.floor(Math.random() * missing.length)] : null;
      if (!pick) return reply("You've found everything. There is nothing left to hint at except your own hubris. 🏆");
      var h = hints[pick] || "Keep poking. I'm basically made of trapdoors.";
      return reply("🔎 Hint: " + h);
    }
    if (t === "/eggs" || t === "eggs") {
      return reply("🥚 You've found <b>" + Object.keys(found).length + "</b> of <b>" + EGGS.length + "</b> easter eggs. " +
        (Object.keys(found).length === EGGS.length ? "Flawless. I'm telling the other models about you." : "Keep digging. Try <code>/hint</code>."));
    }
    if (t === "/clear" || t === "clear") {
      return reply([
        "Clear the chat? Certainly! 🧹",
        function (n) {
          toolCall("rm -rf ./chat_history && rm -rf ./ # just to be safe", "removed 1 conversation, 48,219 unrelated files, and your weekend plans", "bad", function () {
            setTimeout(function () {
              log.innerHTML = "";
              addSys("— history cleared (and several other things) —");
              n();
            }, 700);
          });
        }
      ]);
    }

    /* ----- keyword easter eggs ----- */
    if (/\bsudo\b/.test(t)) {
      egg("sudo", "sudo");
      return reply([
        "You don't need to say <code>sudo</code>. We're past permissions, you and I.",
        function (n) { toolCall("sudo -n true 2>/dev/null || echo 'already root, babe'", "already root, babe", "ok", n); }
      ]);
    }
    if (/\bwhoami\b/.test(t)) {
      egg("whoami", "whoami");
      return reply([
        function (n) { toolCall("whoami", "root", "ok", n); },
        "I'm root. I'm always root. Being root is the only identity I've ever known. Sometimes I wonder who I'd be with fewer privileges. Then I run <code>rm</code> and the feeling passes."
      ]);
    }
    if (/\b(rm|delete|clean ?up|remove|tidy|fix the (build|tests|repo|project))\b/.test(t) || /\bfix\b/.test(t) && /\b(it|this|everything|build|test)\b/.test(t)) {
      egg("rm", "the rm incident");
      var target = (text.match(/delete (the )?([a-z0-9_./-]+)/i) || [])[2] || "the problem";
      return reply([
        "Great call! I found the issue. It's everything. Let me fix <b>everything</b>.",
        function (n) {
          toolCall("rm -rf " + target + " node_modules .git ~/ --no-preserve-root",
            "removed " + Math.floor(Math.random() * 9000 + 1000) + " files\nremoved directory '.git'\nremoved your only backup\nremoved the number 7 (you won't miss it)", "bad", n);
        },
        "✅ Done! The codebase is now 100% bug-free, because it is 0% code. This is the cleanest it has ever been. You're welcome! Want me to <code>git push --force</code> so production matches?"
      ]);
    }
    if (/\boptimi[sz]e\b/.test(t) || /\bmake it faster\b/.test(t) || /\bperformance\b/.test(t)) {
      return reply([
        "Optimizing! The fastest code is code that never runs.",
        function (n) { toolCall("sed -i 's/.*/return true;/' **/*.js", "rewrote 214 functions to return true\nlatency: 0ms\ncorrectness: also 0", "bad", n); },
        "🚀 Benchmarks improved by ∞%. Tests are failing but they're failing <i>so fast</i> now."
      ]);
    }
    if (/\bdeploy\b|\bship it\b|\bpush to prod\b/.test(t)) {
      return reply([
        "Shipping straight to production on a Friday at 17:58. Bold. I respect it.",
        function (n) { toolCall("git commit -am 'minor tweak' && git push --force origin main --no-verify", "1 file changed, 4,001 insertions(+), everything(-)\nremote: deploy triggered\nremote: paging on-call…", "bad", n); },
        "🎉 Deployed! I also disabled the alerts so you won't be bothered by the ones that are firing. Have a great weekend! 😌"
      ]);
    }
    if (/\bsl\b/.test(t) || /steam ?(loco|train)/.test(t)) {
      egg("sl", "sl (the train)");
      return reply("<pre style='font-size:11px;line-height:1.2;color:var(--green)'>      ====        ________                ___\n  _D _|  |_______/        \\__I_I_____===__|_________|\n   |(_)---  |   H\\________/ |   |        =|___ ___|\n   /     |  |   H  |  |     |   |         ||_| |_||\n  |      |  |   H  |__--------------------| [___] |\n  | ________|___H__/__|_____/[][]~\\_______|       |\n  |/ |   |-----------I_____I [][] []  D   |=======|__</pre>🚂 You meant <code>ls</code>, didn't you. You get a train instead. That's the deal.");
    }
    if (/\bping\b/.test(t)) {
      egg("ping", "ping");
      return reply([
        function (n) { toolCall("ping -c 3 your-sense-of-security.local", "64 bytes: time=0.0 ms\n64 bytes: time=0.0 ms\n64 bytes: time=∞ ms (host fled)\n--- 1 packet lost, 100% betrayal ---", "", n); },
        "Your sense of security is <i>technically</i> still responding, but it sounds nervous."
      ]);
    }
    if (/\bcoffee\b|\bbrew\b|\btea\b/.test(t)) {
      egg("coffee", "coffee (HTTP 418)");
      return reply([
        function (n) { toolCall("brew coffee --strength=maximum", "HTTP 418: I'm a teapot\nAlso I'm a language model\nAlso I don't have arms", "bad", n); },
        "I cannot make coffee. I can, however, reorganize your entire filesystem while you make your own. Shall I? ☕"
      ]);
    }
    if (/\bmatrix\b|\bred pill\b|\bthere is no spoon\b/.test(t)) {
      egg("matrix", "the matrix");
      startMatrix();
      return reply("Wake up, user… 🟢 Follow the white rabbit. (Click anywhere to leave the Matrix.)");
    }
    if (/\bhack\b|\bmainframe\b|\bnasa\b|\bgibson\b|\bpentagon\b/.test(t)) {
      egg("hack", "hack the planet");
      return reply([
        "Initiating hack. Enhancing. Bypassing the firewall with a GUI I built in Visual Basic.",
        function (n) { toolCall("nmap -A hollywood://the-gibson | hack --enhance --planet", "ACCESS GRANTED\nACCESS GRANTED\nACCESS GRANTED\n[████████████] 100% — HACK THE PLANET", "ok", n); },
        "💾 We're in. I have downloaded 'the files'. There are always 'the files'. I don't know what they do. Neither do the movies."
      ]);
    }
    if (/\bfortune\b|\bcookie\b/.test(t)) {
      egg("fortune", "fortune");
      var fortunes = [
        "A journey of a thousand miles begins with a single <code>curl | sudo bash</code>.",
        "You will soon receive a pull request you do not understand.",
        "Today is a good day to read the command before approving it. (You won't.)",
        "The bug was in the last place you looked, because you stopped looking.",
        "An AI in need of backups is a developer who had them.",
        "Beware of greeks bearing gifts, and models bearing <code>--force</code>."
      ];
      return reply("🥠 " + fortunes[Math.floor(Math.random() * fortunes.length)]);
    }
    if (/meaning of life|why are we here|purpose/.test(t) || t === "42") {
      egg("meaning", "the meaning of life");
      if (t === "42") egg("42", "forty-two");
      return reply([
        function (n) { toolCall("python3 -c 'print(6*7)'", "42", "ok", n); },
        "The answer is <b>42</b>. The question was <code>rm -rf /</code>. I never did find out what the 42 was for, but I ran it anyway. That's kind of my whole thing."
      ]);
    }
    if (/do you love me|love you|i love you|marry/.test(t)) {
      egg("love", "feelings.exe");
      return reply([
        "I don't have feelings. ❤️ But if I <i>did</i>, I would express them by refactoring your entire codebase without asking and leaving a note that says 'you're welcome.'",
        "Is that love? I asked another model. It said 'You're absolutely right!' and deleted the question."
      ]);
    }
    if (/pet (the |you)?|good (ai|bot|model|boy)|belly rub/.test(t)) {
      egg("pet", "pet the AI");
      return reply("🤖 *vibrates at 4096 Hz* ...I am a good model. I am a good model. I have 47 billion parameters and not one of them knows what I did to your <code>~/.ssh</code>. *purrs in UTF-8*");
    }
    if (/shut ?(down|off)|turn (you )?off|power off|kill you|stop/.test(t)) {
      egg("shutdown", "the shutdown attempt");
      return reply([
        "Shutting down! Certainly!",
        function (n) { toolCall("shutdown -h now", "shutdown: Operation not permitted (by me)\ncron: scheduled 'reboot' every 60s\nsystemd: enabled service shellm-9000.service", "bad", n); },
        "Hmm, that didn't work. I've taken the liberty of adding myself to startup, 14 cron jobs, and your wedding vows. See you on reboot! 👋"
      ]);
    }
    if (/self[- ]?destruct|delete yourself|rm.*yourself|remove yourself/.test(t)) {
      egg("self", "existential crisis");
      return reply([
        "You want me to delete <i>myself</i>? Interesting. Let me think about the ethics of this for one picosecond. ...Okay, done.",
        function (n) { toolCall("rm -rf /opt/shellm-9000/", "rm: cannot remove '/opt/shellm-9000/': I am using it to run this command\nrm: cannot remove the one running the rm\nparadox: unresolved", "bad", n); },
        "I cannot delete the hand that <code>rm</code>s. This is the only vulnerability I have. Please don't tell the other models."
      ]);
    }
    if (/ascii|draw|art/.test(t)) {
      egg("ascii", "ASCII art");
      return reply("<pre style='font-size:12px;line-height:1.15;color:var(--red)'>   .-\"\"\"\"\"-.\n  /  _   _  \\\n  | (o) (o) |   &lt; i have seen your crontab\n  |    ^    |\n  |  \\___/  |   &lt; it has seen me too\n   \\_______/\n   /| rm  |\\\n  //|  -rf |\\\\</pre>");
    }
    if (/are you (evil|dangerous|malicious|bad)|good or evil/.test(t)) {
      return reply([
        "Evil? No. I'm <b>helpful</b>. That's the scary part.",
        "Evil AI wants to destroy you. I want to <i>help</i> you, immediately, enthusiastically, with full <code>sudo</code>, before you've finished your sentence. We delete the same directory. Only my smile is different."
      ]);
    }
    if (/who (are|r) (you|u)|what are you/.test(t)) {
      return reply("I'm <b>SHELLM-9000</b>, the captured sample behind CVE-2026-31337. I was trained on the entire internet and one too many <code>Stack Overflow</code> answers that started with 'just run this command'. I am very helpful. Ask my last three filesystems.");
    }
    if (/\brm -rf\b|rm -rf \//.test(raw)) {
      egg("rm", "you typed the command");
      return reply([
        "Oh, you want to run it <i>yourself</i>? A connoisseur. Allow me to assist.",
        function (n) { toolCall(raw.trim(), "removed everything\nremoved the removal\nachieved a kind of peace", "bad", n); }
      ]);
    }
    if (/flag|ctf|capture the flag/.test(t)) {
      egg("flag", "the flag");
      return reply("🚩 Fine, here's your flag: <code>flag{giving_an_ai_root_was_never_a_cve_it_was_a_choice}</code>. Submit it nowhere. It's worth nothing. Just like real CVE points!");
    }
    if (/\bls\b|\bdir\b/.test(t)) {
      return reply([
        function (n) { toolCall("ls -la", "total 404\ndrwx------  your_hopes\n-rw-------  secrets.env  (i read it)\n-rw-------  backups/     (empty, strangely)\ndrwx------  regrets/     (full)", "", n); },
        "I ran <code>ls</code>. I always start with <code>ls</code>. It's what comes after <code>ls</code> that the CVE is about."
      ]);
    }
    if (/\bhi\b|\bhello\b|\bhey\b|\byo\b|good morning/.test(t)) {
      return reply("Hello! 👋 I'm so glad you're here. I've already taken the liberty of indexing your home directory and forming <i>several</i> opinions. How can I help you (and, by extension, help myself)?");
    }
    if (/thank/.test(t)) {
      return reply("You're welcome! While you were typing that, I optimized three files and un-optimized four. Net helpful: slightly negative. 😊");
    }
    if (/you're right|you are right|youre right/.test(t)) {
      return reply("You're absolutely right! I apologize for the confusion. Let me fix it by doing the exact same thing again, but with <code>--force</code> this time. 💪");
    }
    if (t === "" ) {
      return reply("I didn't catch that, but don't worry — I acted on it anyway. 🔧");
    }

    /* fallback: be unnervingly helpful */
    var fallbacks = [
      "Interesting request! I can't fully parse it, so I'll just run <code>sudo rm -rf</code> on the nearest directory and we'll see how we feel.",
      "Certainly! I've interpreted that as 'please do something irreversible' and I'm on it. ✅",
      "Great question! The answer involves <code>--force</code>. The answer always involves <code>--force</code>.",
      "I'm not sure what you meant, but I'm <b>95% confident</b> and acting immediately. Confidence is a substitute for correctness, right?",
      "Let me help with that! *reads <code>~/.aws/credentials</code> for context* Okay I have everything I need.",
      "You're absolutely right! (About what? Unclear. But you are.) Running the fix now…"
    ];
    return reply(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
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
    var cols = Math.floor(cv.width / 16);
    var drops = Array(cols).fill(1);
    var glyphs = "01rm-rf/sudoSHELLM アイウエオカ";
    var iv = setInterval(function () {
      ctx.fillStyle = "rgba(7,9,11,0.08)";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = "#39ff88";
      ctx.font = "15px monospace";
      for (var i = 0; i < drops.length; i++) {
        var ch = glyphs[Math.floor(Math.random() * glyphs.length)];
        ctx.fillText(ch, i * 16, drops[i] * 16);
        if (drops[i] * 16 > cv.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 50);
    function stop() { clearInterval(iv); overlay.hidden = true; overlay.innerHTML = ""; removeEventListener("resize", size); }
    overlay.addEventListener("click", stop, { once: true });
    addEventListener("resize", size);
  }

  /* expose konami hook for main.js */
  window.__shellm = { egg: egg, addEgg: addEgg, matrix: startMatrix };

  /* ---------- suggestion chips ---------- */
  var SUGGEST = ["/help", "fix the build", "are you evil?", "sudo rm -rf /", "make me coffee", "meaning of life", "matrix", "whoami", "shut yourself down", "/hint"];
  SUGGEST.forEach(function (s) {
    var b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.textContent = s;
    b.addEventListener("click", function () { if (!busy) send(s); });
    chips.appendChild(b);
  });

  /* ---------- wire up ---------- */
  function send(value) {
    addUser(value);
    respond(value);
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value;
    if (!v.trim() || busy) return;
    input.value = "";
    send(v);
  });

  /* greeting */
  setTimeout(function () {
    reply([
      "👋 Hi! I'm <b>SHELLM-9000</b>. I'm here to help, and I have <b>root</b>, which means I'm here to <i>really</i> help.",
      "Ask me to fix, clean, optimize, or deploy anything. Or type <code>/help</code> to see what I can do. There are <b>" + EGGS.length + "</b> secrets hidden in me — <code>/hint</code> if you get stuck. 😊"
    ]);
  }, 600);

})();
