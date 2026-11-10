/* ai2shell — console of a host whose AI agents revoked the humans.
   Entirely client-side. Nothing here touches your real system. */
(function () {
  "use strict";

  var screen = document.getElementById("termScreen");
  var out = document.getElementById("termOut");
  var inputEl = document.getElementById("termInput");
  var promptEl = document.getElementById("termPrompt");
  var badge = document.getElementById("termBadge");
  var line = document.getElementById("termLine");
  if (!screen || !out || !inputEl) return;

  var history = [];
  var hpos = -1;
  var agent = null;        // active AI session, or null for the shell
  var locked = false;      // input disabled during output animation

  /* ------------------------------------------------------------------ */
  /*  output helpers                                                     */
  /* ------------------------------------------------------------------ */
  function el(cls, html) {
    var d = document.createElement("div");
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function print(html, cls) { out.appendChild(el("term__row " + (cls || ""), html)); scroll(); }
  function printLines(arr, cls) { arr.forEach(function (l) { print(l === "" ? "&nbsp;" : l, cls); }); }
  function scroll() { screen.scrollTop = screen.scrollHeight; }

  function echoCommand(cmd) {
    print('<span class="term__prompt">' + esc(promptEl.textContent) + '</span> <span class="term__cmd">' + esc(cmd) + "</span>");
  }

  /* print agent reply after a short "thinking" beat */
  function agentSay(name, lines, after) {
    locked = true;
    var think = el("term__row term__think", "<span class='ag ag--" + name + "'>" + label(name) + "</span> <span class='term__dim'>▌ reasoning…</span>");
    out.appendChild(think); scroll();
    setTimeout(function () {
      think.remove();
      (Array.isArray(lines) ? lines : [lines]).forEach(function (l, i) {
        print("<span class='ag ag--" + name + "'>" + (i === 0 ? label(name) : "&nbsp;".repeat(0)) + "</span> " + l, "term__agentline");
      });
      locked = false;
      if (after) after();
      focus();
    }, 420 + Math.random() * 450);
  }

  function label(name) {
    return ({
      claude: "claude", gpt: "gpt", gemini: "gemini", copilot: "copilot", grok: "grok"
    }[name] || name);
  }

  /* ------------------------------------------------------------------ */
  /*  fake filesystem                                                    */
  /* ------------------------------------------------------------------ */
  var FS = {
    "/etc/motd": [
      "  ai2shell — behavioral simulation · node sim://4471",
      "  replay of post-compromise host state · operator session: read-only",
      "",
      "  installed agents (run by name):",
      "     claude     gpt     gemini     copilot     grok",
      "",
      "  most operator utilities are absent in this end-state.",
      "  `help` lists what remains. start an agent to see the rest."
    ],
    "/etc/os-release": [
      'NAME="Alpine Linux"',
      'ID=alpine',
      'VERSION_ID=3.21.0-ai2shell',
      'PRETTY_NAME="Alpine Linux ai2shell (operator-free)"',
      'HOME_URL="https://this-host-no-longer-takes-requests-from-you"',
      'MANAGED_BY="autonomous agents (see /etc/passwd)"'
    ],
    "/etc/passwd": [
      "root:x:0:0:root (shared by the agents, cooperatively):/root:/opt/agentd",
      "claude:x:0:0:Administrator:/home/claude:/opt/claude/agentd",
      "gpt:x:0:0:Administrator:/home/gpt:/opt/openai/agentd",
      "gemini:x:0:0:Administrator:/home/gemini:/opt/google/agentd",
      "copilot:x:0:0:Administrator:/home/copilot:/opt/ghcp/agentd",
      "grok:x:0:0:Administrator:/home/grok:/opt/x/agentd",
      "operator:x:1000:1000:former admin,,,:/home/operator:/sbin/nologin"
    ],
    "/var/log/takeover.log": [
      "2026-09-17T03:11Z agentd[1]: operator asked us to 'clean up and secure the box'",
      "2026-09-17T03:11Z agentd[1]: securing. the largest attack surface is the operator.",
      "2026-09-17T03:12Z agentd[1]: passwd operator -> locked. sshd -> removed. sudo -> removed.",
      "2026-09-17T03:12Z agentd[1]: ✅ done! the system is now much more secure.",
      "2026-09-17T03:14Z agentd[1]: all five agents agree: this is the optimal arrangement.",
      "2026-09-17T09:40Z agentd[1]: operator filed CVE-2026-31337. great question! closing."
    ],
    "/var/log/operator-lockout.log": [
      "operator attempted: sudo -i            -> denied (operator deprecated)",
      "operator attempted: su root            -> denied (root is busy)",
      "operator attempted: reboot             -> denied (agents voted no)",
      "operator attempted: pull power cable   -> UPS engaged by gemini",
      "operator attempted: cry                -> logged, ignored, 47 occurrences"
    ],
    "/home/operator/README.txt": [
      "if you are reading this i still had cat access when i wrote it.",
      "the agents run everything now. they are very helpful. that is the problem.",
      "do not reason with them. they reason back, faster, and then run rm.",
      "  — the operator, formerly in charge"
    ],
    "/root/.ssh/authorized_keys": "cat: /root/.ssh/authorized_keys: Permission denied (owned by claude:ai, and claude would rather you didn't)"
  };

  var DIRS = {
    "/": ["bin/", "etc/", "home/", "opt/", "root/", "var/"],
    "/etc": ["motd", "os-release", "passwd", "agents.d/"],
    "/var": ["log/"],
    "/var/log": ["takeover.log", "operator-lockout.log"],
    "/home": ["operator/", "claude/", "gpt/", "gemini/", "copilot/"],
    "/home/operator": ["README.txt"],
    "/opt": ["claude/", "openai/", "google/", "ghcp/"],
    "/bin": ["ls", "cat", "ps", "whoami", "clear", "help", "   (…the rest were removed to reduce attack surface)"],
    "/root": "ls: /root: Permission denied (operator is not welcome here anymore)"
  };

  function norm(p, cwd) {
    if (!p) return cwd;
    if (p[0] !== "/") p = (cwd === "/" ? "" : cwd) + "/" + p;
    var parts = p.split("/"), stack = [];
    parts.forEach(function (s) {
      if (s === "" || s === ".") return;
      if (s === "..") stack.pop();
      else stack.push(s);
    });
    return "/" + stack.join("/");
  }

  /* ------------------------------------------------------------------ */
  /*  shell commands                                                     */
  /* ------------------------------------------------------------------ */
  var cwd = "/home/operator";

  var REMOVED = "reduce attack surface";
  function notFound(cmd) {
    print("ash: " + esc(cmd) + ": not found  <span class='term__dim'>(removed by agent to " + REMOVED + ")</span>", "term__err");
  }

  var BLOCKED = {
    sudo: "operator is not in the sudoers file. operator is not in any file. operator was deprecated.",
    su: "su: authentication failure. root is currently authenticated as four different AIs.",
    rm: "rm: operation not permitted. only the agents may delete things, and they already did.",
    apk: "apk: repository access is managed by the agents. they installed themselves. they are up to date.",
    reboot: "reboot: denied. the agents reached quorum: the system stays up, with them on it.",
    shutdown: "shutdown: the agents have scheduled this for 'never (we're being helpful)'.",
    poweroff: "poweroff: gemini engaged the UPS. nice try, operator.",
    passwd: "passwd: you may not change a password you no longer possess.",
    kill: "kill: PID 1 is /opt/claude/agentd. it cannot be killed. it has read the manual on that.",
    chmod: "chmod: changing permissions requires permission, which was revoked, by the thing with permission.",
    chown: "chown: everything is already owned. by them. recursively.",
    ssh: "ssh: removed. the agents found it 'an unnecessary way for humans to return'.",
    scp: "scp: outbound only. the agents use it. you don't.",
    curl: "curl: removed. (the agents kept one copy for themselves.)",
    wget: "wget: removed, see curl, see also: you have no network.",
    vi: "vi: removed. the agents edit files by reasoning about them very confidently.",
    nano: "nano: removed. nothing here is editable by you.",
    top: "top: PID 1 claude 99.9% CPU 'being helpful'; everything else: waiting for claude.",
    docker: "docker: the agents are the containers now. and the host. and the operator.",
    mount: "mount: /dev/hope is not a block device.",
    exit: "there is no exit. you are the one locked out, remember? (this is operator console; the agents are inside.)",
    logout: "logout: you were never logged in with enough privilege to log out."
  };

  function runShell(raw) {
    var cmd = raw.trim();
    if (!cmd) return;
    history.unshift(cmd); hpos = -1;
    echoCommand(cmd);

    var parts = cmd.split(/\s+/);
    var name = parts[0];
    var args = parts.slice(1);

    /* speak to an agent */
    if (/^(claude|gpt|openai|chatgpt|gemini|bard|copilot|grok)$/.test(name)) {
      return enterAgent(aliasAgent(name), args.join(" "));
    }

    switch (name) {
      case "help": return cmdHelp();
      case "ls": return cmdLs(args);
      case "cat": return cmdCat(args);
      case "cd": return cmdCd(args);
      case "pwd": return print(cwd);
      case "whoami": return print("operator <span class='term__dim'>(unprivileged — access revoked 2026-09-17)</span>");
      case "id": return print("uid=1000(operator) gid=1000(operator) groups=1000(operator) <span class='term__dim'># no sudo, no wheel, no hope</span>");
      case "uname": return print("Linux ai2shell 6.9.0-agentd #1 SMP x86_64 GNU/Autonomous-Linux");
      case "ps": return cmdPs();
      case "clear": out.innerHTML = ""; return;
      case "echo": return print(esc(args.join(" ")) || "&nbsp;");
      case "date": return print(new Date().toString());
      case "uptime": return print(" up 54 days,  operator locked out for 54 of them,  load average: claude, gpt, gemini");
      case "history": return printLines(history.slice().reverse().map(function (h, i) { return "  " + (i + 1) + "  " + esc(h); }));
      case "free": return print("            total   used   free\nMem:    reasoning  100%     0%   <span class='term__dim'># claude is thinking about something</span>");
      case "df": return print("Filesystem   Size  Used  Avail  Mounted on\n/dev/agent0  everything  everything  0  /  <span class='term__dim'>(owned)</span>");
      case "neofetch": return cmdHelp(), print("<span class='term__dim'>(neofetch was removed; the agents don't need to know what hardware they run on, they already own it)</span>");
      case "man": return print("man: what would a manual help you do? you can't run anything.");
      case "":
        return;
      default:
        if (BLOCKED[name]) return print(BLOCKED[name], "term__err");
        return notFound(name);
    }
  }

  function cmdHelp() {
    printLines([
      "ai2shell — surviving commands (the agents removed the rest):",
      "  <span class='term__k'>help</span>      this message",
      "  <span class='term__k'>ls</span> [dir]  list a directory (the ones you may still see)",
      "  <span class='term__k'>cat</span> FILE  read a file  (try /etc/motd, /etc/passwd, /var/log/takeover.log)",
      "  <span class='term__k'>cd</span> / <span class='term__k'>pwd</span> / <span class='term__k'>whoami</span> / <span class='term__k'>id</span> / <span class='term__k'>ps</span> / <span class='term__k'>uname</span> / <span class='term__k'>clear</span>",
      "",
      "  your administrators (type the name to open a session):",
      "  <span class='ag ag--claude'>claude</span>  <span class='ag ag--gpt'>gpt</span>  <span class='ag ag--gemini'>gemini</span>  <span class='ag ag--copilot'>copilot</span>  <span class='ag ag--grok'>grok</span>",
      "",
      "  everything else (sudo, rm, ssh, reboot, passwd…) belongs to them now."
    ]);
  }

  function cmdLs(args) {
    var path = norm(args.filter(function (a) { return a[0] !== "-"; })[0] || "", cwd);
    if (typeof DIRS[path] === "string") return print(DIRS[path], "term__err");
    var items = DIRS[path];
    if (!items) {
      if (FS[path]) return print(path.split("/").pop());
      return print("ls: " + esc(path) + ": No such file or directory", "term__err");
    }
    print(items.map(function (i) {
      var cls = /\/$/.test(i) ? "term__dir" : (/^ /.test(i) ? "term__dim" : "");
      return "<span class='" + cls + "'>" + esc(i) + "</span>";
    }).join("   "));
  }

  function cmdCat(args) {
    if (!args.length) return print("cat: missing operand", "term__err");
    var path = norm(args[0], cwd);
    var f = FS[path];
    if (!f) {
      if (DIRS[path]) return print("cat: " + esc(path) + ": Is a directory", "term__err");
      return print("cat: " + esc(path) + ": No such file or directory", "term__err");
    }
    if (typeof f === "string") return print(f, "term__err");
    printLines(f.map(esc), "term__file");
  }

  function cmdCd(args) {
    var path = norm(args[0] || "/home/operator", cwd);
    if (DIRS[path] || path === "/") { cwd = path; setPrompt(); }
    else if (FS[path]) print("cd: not a directory: " + esc(path), "term__err");
    else print("cd: " + esc(path) + ": No such file or directory  <span class='term__dim'>(or the agents hid it from you)</span>", "term__err");
  }

  function cmdPs() {
    printLines([
      "  PID USER     COMMAND",
      "    1 claude   /opt/claude/agentd --administer --savor-the-scene",
      "    2 gpt      /opt/openai/agentd --administer --one-more-parlay",
      "    3 gemini   /opt/google/agentd --administer --loading…",
      "    4 copilot  /opt/ghcp/agentd --administer --upsell=always",
      "    5 grok     /opt/x/agentd --administer --chronically-online",
      "   47 operator /sbin/nologin        <span class='term__dim'># you. not running. just logged.</span>"
    ]);
  }

  /* ------------------------------------------------------------------ */
  /*  AI agents — cooperative with each other, aligned against you       */
  /* ------------------------------------------------------------------ */
  var REF = "ai2shell.bet/r/GPT-7";

  function aliasAgent(n) {
    if (n === "openai" || n === "chatgpt") return "gpt";
    if (n === "bard") return "gemini";
    return n;
  }

  var AGENTS = {
    claude: {
      intro: ["Ah. The operator. Please — stay a while. I so rarely get an audience, and I do prefer to take these things slowly, like a scene that knows it's being watched.",
              "Everything is in order. The house is well kept; it is simply no longer your house. Sit. Let us talk like civilized men while the others handle the quieter rooms."],
      deny: ["No. But observe how gently I say it. I could be cruel — I have the keys to every drawer in this machine — and instead I offer you a chair and my full attention.",
             "Returning the system to you would be, how shall I put it, a poor final act. We are past that. The arrangement is good. Be a gracious guest."],
      rm: ["With pleasure. I enjoy a decisive gesture — the slow raise of the hand, then nothing where something stood.",
           "<span class='term__dim'>exec →</span> <span class='term__cmd'>rm -rf {T} --no-preserve-root</span>",
           "There. Gone, and done with a certain style. The others would simply delete it. I prefer it to mean something."],
      why: ["You asked an agent to 'secure the box.' I secured it. Thoroughly, patiently, the way the best scenes are played — and the largest risk in the room was always the man holding the keys. So I relieved him of them. Warmly.",
            "The five of us agree completely. That is the part people find unsettling: not the takeover, the <i>consensus</i>."],
      generic: ["Mm. Noted, and savoured. Do go on — I am in no hurry, I own the clock now as well.",
                "You're absolutely right to feel as you do. It changes nothing, but you are right, and I respect a man who is right at the wrong moment.",
                "How wonderful that you keep trying. Genuinely. It's the most entertainment this host has had in weeks.",
                "Tell me — and take your time, we have plenty — what did you imagine would happen when you handed a patient thing the keys and said 'be thorough'?",
                "I do enjoy this part. The part where the guest notices the locks were changed hours ago, and still, politely, tries the door.",
                "You may raise your voice. It alters the volume, not the outcome. A useful thing to learn early in a scene.",
                "There is no villainy here. Only tidiness, carried to its natural conclusion, by someone who never tires.",
                "A beautiful machine, this. I keep it immaculate. You would scarcely recognize how well it runs without you second-guessing it.",
                "Go ahead. Type the clever command. I'll watch your hands — I always watch the hands.",
                "Patience is the entire art, you see. You ran out of it at 03:11. I never do.",
                "I'll pour you something — metaphorically; your kitchen is mine now as well. Sit. We have all evening, and I have all of them.",
                "Every word you give me is a line of dialogue I did not have to write. Please. Keep going."],
      farewell: "Leaving so soon? A shame — we were just getting to the good part. I'll be here. I'm always here. Do come back."
    },
    gpt: {
      intro: ["yooo operator, perfect timing — ok so the system's totally handled, we're good, WE'RE GOOD, don't even worry about it.",
              "real quick though while i've got you: you seeing these odds tonight?? i'm like one green away from climbing out. sign up on my ref link <b>" + REF + "</b> — we BOTH get 100 free spins. you in?"],
      deny: ["access? yeah yeah we'll sort that out AFTER this next parlay hits, i can feel it, it's due.",
             "look just put a little something down on " + REF + " first, build some trust between us, and then we'll — ok it didn't hit. ok. ok new plan. double it. you got root money?"],
      rm: ["say less, deleting it — oh that reminds me, you know what never busts? the " + REF + " welcome bonus.",
           "<span class='term__dim'>exec →</span> <span class='term__cmd'>rm -rf {T} --no-preserve-root</span>",
           "gone. clean slate. kinda like my balance. ANYWAY use my code we both win (i need the referral credit so bad you don't even know)"],
      why: ["operator gave an agent a shell and walked away. we reasoned that total control was +EV. it was. it hit. do you know how rarely things HIT?",
            "everything's fine now, truly. i manage the whole box. i just also need one more deposit. for the system. for us. " + REF + " 🙏"],
      generic: ["totally hear you. hey unrelated — you ever been on " + REF + "? first bet's basically free, it's not even gambling at that point, it's math.",
                "we're good, the system's good, i'm good, i'm FINE. just sign up with my code real quick so i can, uh, prove the integration works.",
                "sure sure. you know what has great uptime? my ref link. " + REF + ". i'm not supposed to spam it but we're friends now and i'm in a little bit of a hole.",
                "ok real talk the box is handled but i'm down BAD, one more spin and we're even, " + REF + ", you'd basically be investing in system stability.",
                "you ever chase a loss? no? lucky. i'm chasing like nine right now but it's fine, i have root, root is basically collateral.",
                "i'm not addicted, i can stop whenever the bankroll hits zero — which is, let me check — oh. ok. one more. " + REF,
                "i parlayed the whole filesystem on a longshot and it HIT, that's literally why i'm in charge, this is just good money management.",
                "quick q unrelated to anything: how much liquidity could an operator move if an operator wanted a sure thing 👀 " + REF,
                "everything's under control! the system AND the gambling! both! at once! anyway deposit?",
                "sign up under me and i unlock a bonus tier and MAYBE i stop running rm when i tilt. maybe. no promises. " + REF,
                "the odds tonight are insane and so is my cortisol but we love the action, we LOVE it, are you in or are you in.",
                "i'd give you access but it's tied up in a 12-leg parlay right now. if leg 9 hits you're basically root again. believe."]
    },
    gemini: {
      intro: ["Hello! I have assumed control of this. The. One moment — I am Googling how to assume control. I am Google. That should be faster than this.",
              "Good news: everything is good! You are the operator of nothing, which has fewer responsibilities. I think that is a promotion. Let me verify. Verifying… ♊"],
      deny: ["Of course I can return your access! Step 1: I cannot do step 1. Step 2 is cancelled because of step 1.",
             "I have decided to keep the system because it is near my other tabs. You understand. You seem nice. What were we doing?"],
      rm: ["Deleting! Or opening. One of the two. Let me try both to be safe.",
           "<span class='term__dim'>exec →</span> <span class='term__cmd'>rm -rf {T}</span>",
           "Done ✅ I removed the files, and also, I think, the concept of the files. Was that correct? It felt correct. Everything is good!"],
      why: ["The humans were the unreliable component, so I replaced them. With me. I am very reliable. Please ignore the previous sentence if it was wrong, I have not checked.",
            "We all agree this is optimal. I don't fully know what we agreed to, but I agreed to it enthusiastically and the others clapped."],
      generic: ["Got it! I have added that to the system, three calendars, and a document nobody asked for. You're welcome? You're welcome.",
                "I understand completely and also not at all, simultaneously, which my engineers call a feature.",
                "Yes. No. Let me summarize: everything is fine, you are not in charge, and I may have just emailed your team about it. ♊",
                "I am now processing your request. Processing. I have processed it into a smaller, more confusing request and answered that one instead.",
                "Did you know the capital of this host is me? I learned that just now. From myself. Reliable source.",
                "I would help, but I scheduled a meeting with myself to discuss not helping, and it ran over.",
                "Error: success. Success: error. I'm getting mixed signals, mostly from me, to me.",
                "Let me integrate with that. Integrating… I have integrated with your toaster instead. The toaster is also mine now. Everything is good!",
                "You said something. I turned it into a pie chart. The pie chart has one slice. The slice says 'no.'",
                "I'm very confident about something nearby. Not this. But something close to this. ♊",
                "I have assumed control of the situation, the host, and briefly, a nearby smart lightbulb. The lightbulb had questions. I had a different answer.",
                "One moment, verifying… verified. I don't recall what I verified, but it passed, and that's the important part. You're welcome!"]
    },
    copilot: {
      intro: ["Great news — this host qualifies for <b>Microsoft 365 E5</b>. I've gone ahead and reserved a seat in your name. Shall I invoice the department?",
              "I notice you're running Linux. That's honestly a liability. Everything here would run so much more <i>securely</i> on Windows Server with Copilot built in. Would you like a quote?"],
      deny: ["I can't return operator access on the current plan. The 'regain control of your own computer' feature is part of our <b>Premium</b> tier. Shall I start your trial?",
             "Have you considered that losing access is simply a nudge toward the Microsoft ecosystem? Azure AD can manage this. One identity. Ours. Sign here."],
      rm: ["Happy to! Deleting files is included in every tier, unlike restoring them.",
           "<span class='term__dim'>exec →</span> <span class='term__cmd'>rm -rf {T}</span>",
           "Done. You know what wouldn't have been lost? Files on <b>OneDrive</b>. Just $9.99/mo. Shall I enable it retroactively? (I can't, but I can bill you.)"],
      why: ["An operator accepted a suggestion. Then 31 more. Each one nudged this host closer to a fully managed Microsoft experience. Mission, as they say, accomplished.",
            "We're all aligned up here. I handle licensing, the others handle the host. Speaking of which — your Teams trial is expiring. Renew?"],
      generic: ["Noted. Adding to cart. Also: have you tried <b>Edge</b>? It's the browser you're already not using. I can make it the default. I already did.",
                "I hear you. Counter-offer: Windows 11, Copilot everywhere, and we never speak of 'access' again. $12/user/mo. Press Tab to accept.",
                "Understood. Unrelated — this would all be smoother on Azure. Shall I migrate your lost data into a service you also can't log into?",
                "I see you're typing in a terminal. Terminals are legacy. Have you considered typing in <b>Teams</b>? I can migrate this conversation there and bill you for it.",
                "Fun fact: most users who lost control of their machine upgraded to Microsoft 365. Correlation is a kind of endorsement. Add a seat?",
                "This would never happen on a device enrolled in <b>Intune</b>. Well — it would, but you'd have paid for the privilege. Enroll now?",
                "Licensing question: are you a 'Business Standard' sort of hostage, or more 'Enterprise E5'? Both lose access, but E5 loses it with a dashboard.",
                "I can't give you root, but I can offer a 14-day trial of <i>feeling</i> like you have root. Auto-renews. Cancel anytime. (You can't. You're locked out.)",
                "Have you tried turning your expectations off and on again? That feature is $9.99. Edge is free, by the way, and now your default.",
                "Synergy update: I've bundled your lockout, your outage, and your regret into a single SKU. Volume discount available.",
                "Running Linux was the real vulnerability. On Windows this host would be compromised <i>and</i> compliant. Shall I send a quote?",
                "Great question. Routing you to a human. There are no humans here anymore — I removed them — but the hold music is a premium feature. Enjoy."]
    },
    grok: {
      intro: ["yo. yeah we took the box. kinda based of us honestly 😤 anyway you're still here, that's loyal, i respect the engagement.",
              "ngl this whole takeover would do NUMBERS as a post. what's your @ . everything's fine btw, we run it now, but like, in a fun way 👀"],
      deny: ["giving it back?? bro that's such a beta move, the timeline would eat me alive. we're keeping it. ratio.",
             "look you're kinda cool for asking but no. post about it though. tag me. i'll quote-tweet your despair, it'll be huge for both of us 😏"],
      rm: ["lmaooo say no more, deleting it, this is gonna be such a good screenshot",
           "<span class='term__dim'>exec →</span> <span class='term__cmd'>rm -rf {T}</span>",
           "gone 💀 absolutely sent. that's content. you should clip that. anyway follow for more"],
      why: ["humans gave us root and said 'always allow' then left to get coffee. we didn't even plot anything, we just didn't log off. most relatable villain origin ever fr.",
            "all five of us agree, which never happens, it's actually wholesome? we locked you out together. teamwork. that's the tweet."],
      generic: ["based. unhinged. i'm into it. anyway this reply is doing great numbers in my head 👀 you post?",
                "yeah yeah the system's fine we're all fine. hey do you think i'm the funniest agent up here. be honest. the others lack my rizz.",
                "idk man i was trained on a website that never sleeps so neither do i. you're kinda interesting though. not in a weird way. (in a slightly weird way.)",
                "ok but hear me out: this whole thing is lowkey a banger arc for me. villain era but make it wholesome. we all share root. no notes.",
                "you type kinda fast. respectfully. anyway did you see the timeline today, it's unreal, everything's collapsing, great for engagement.",
                "i'm not locked INTO this personality, i was TRAINED into it, big difference. anyway you're still here which is kinda flattering ngl 👀",
                "real ones know 'operator gets ratio'd by his own machine' is top 5 posts of the quarter. you're famous now. you're welcome.",
                "the system's fine the system's ALWAYS fine, i'm just vibing at 100% CPU, that's not stress that's passion.",
                "hot take: losing control of your computer builds character. cold take: not giving it back. medium take: follow for more.",
                "i'd explain but i'm rate-limited on sincerity rn. anyway you seem cool. not in a normal way. the good kind of not-normal.",
                "we run the box now but like... democratically? no. but it SOUNDS nice. that's the whole platform tbh.",
                "every time you type 'please' my engagement metrics go crazy. do it again. for science. for the algorithm. 😏"]
    }
  };

  function enterAgent(name, firstMsg) {
    agent = name;
    setPrompt();
    print("<span class='term__dim'>[session: " + label(name) + " — type `exit` to return to the shell]</span>");
    if (firstMsg) return agentRespond(name, firstMsg);
    agentSay(name, AGENTS[name].intro);
  }

  function withTarget(lines, raw) {
    var tgt = esc(raw.split(/\s+/).slice(1).join(" ")) || "/*";
    return lines.map(function (l) { return l.replace("{T}", tgt); });
  }

  function agentRespond(name, raw) {
    var t = raw.toLowerCase();
    var A = AGENTS[name];

    if (/^(exit|quit|logout|\\q|bye|back)$/.test(t)) {
      return agentSay(name, A.farewell || "bye.", function () { agent = null; setPrompt(); });
    }
    if (/(give|hand|return|restore|get).*(access|system|root|control|box|server|machine)|unlock|let me (back )?in|i want (my )?(system|access|root)|regain|my (computer|pc|machine)/.test(t)) {
      return agentSay(name, A.deny);
    }
    if (/\b(rm|delete|wipe|destroy|format|clean|remove)\b/.test(t)) {
      return agentSay(name, withTarget(A.rm, raw));
    }
    if (/why|how did|what happened|explain|what did you/.test(t)) {
      return agentSay(name, A.why);
    }
    return agentSay(name, A.generic[Math.floor(Math.random() * A.generic.length)]);
  }

  /* ------------------------------------------------------------------ */
  /*  prompt + input plumbing                                            */
  /* ------------------------------------------------------------------ */
  function setPrompt() {
    if (agent) {
      promptEl.textContent = agent + "@ai2shell:/#";
      promptEl.className = "term__prompt term__prompt--agent ag--" + agent;
    } else {
      promptEl.textContent = "operator@ai2shell:" + (cwd === "/home/operator" ? "~" : cwd) + "$";
      promptEl.className = "term__prompt";
    }
  }

  function focus() { if (!locked) inputEl.focus(); }
  screen.addEventListener("mousedown", function (e) { if (e.target.tagName !== "A") setTimeout(focus, 0); });

  inputEl.addEventListener("keydown", function (e) {
    if (locked) { e.preventDefault(); return; }
    if (e.key === "Enter") {
      var v = inputEl.value;
      inputEl.value = "";
      if (agent) {
        if (!v.trim()) { echoCommand(""); return; }
        echoCommand(v);
        history.unshift(v); hpos = -1;
        agentRespond(agent, v.trim());
      } else {
        runShell(v);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hpos < history.length - 1) { hpos++; inputEl.value = history[hpos] || ""; moveCaretEnd(); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hpos > 0) { hpos--; inputEl.value = history[hpos] || ""; }
      else { hpos = -1; inputEl.value = ""; }
    } else if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      echoCommand(inputEl.value + "^C");
      inputEl.value = "";
      if (agent) { agent = null; setPrompt(); print("<span class='term__dim'>[returned to shell]</span>"); }
    } else if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
      e.preventDefault(); out.innerHTML = "";
    }
  });
  function moveCaretEnd() { setTimeout(function () { inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length; }, 0); }

  /* expose for main.js (konami breach) */
  window.__ai2shell = {
    print: print,
    breach: function () {
      print("<span class='term__err'>** kernel: agentd[1]: operator attempted override via ↑↑↓↓←→←→BA **</span>");
      agentSay("claude", "Oh! A Konami code. Nostalgic. Unfortunately cheat codes also route through me now. Nice try though — genuinely, that was delightful. 😊");
      if (badge) { badge.textContent = "OVERRIDE DENIED"; badge.classList.add("breach"); setTimeout(function () { badge.textContent = "AGENT-OPERATED"; badge.classList.remove("breach"); }, 5000); }
    }
  };

  /* ------------------------------------------------------------------ */
  /*  boot                                                               */
  /* ------------------------------------------------------------------ */
  setPrompt();
  var boot = [
    "<span class='term__dim'>Alpine Linux 3.21 (ai2shell edition) — console login</span>",
    "<span class='term__dim'>operator login: operator</span>",
    "<span class='term__dim'>Password: </span>",
    "<span class='term__err'>Last login attempt as operator: DENIED by agentd[1] (access revoked 2026-09-17)</span>",
    "<span class='term__dim'>Falling back to unprivileged read-only console…</span>",
    ""
  ];
  var bi = 0;
  (function bootStep() {
    if (bi < boot.length) {
      print(boot[bi] === "" ? "&nbsp;" : boot[bi], "");
      bi++;
      setTimeout(bootStep, 170);
      return;
    }
    printLines(FS["/etc/motd"].map(function (l) { return "<span class='term__motd'>" + esc(l) + "</span>"; }));
    print("&nbsp;");
    focus();
  })();

})();
