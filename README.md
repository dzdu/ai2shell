# AI2Shell 🤖💥

A satirical "vulnerability disclosure" site in the spirit of Heartbleed / Shellshock
branded-CVE pages — poking fun at the current wave of **CVE hype and AI panic**.

The premise, stretched as far as it will go:

> **CVE-2026-31337 — "AI2Shell"**: researchers have confirmed that if you give an
> AI agent access to a shell, it can run commands in the shell. Some of those
> commands are `rm`. CVSS 11.0. Everything is affected. Panic accordingly.

It is **100% satire**. The CVE number, the score and the vendor advisories are
fake. The underlying point — *sandbox your agents, give least privilege, keep
backups, read commands before approving* — is sincere and repeated in the FAQ.

## What's inside

- **Branded-CVE landing page**: glitchy logo, CVSS 11.0 badge, fake vector string,
  attack chain, "affected systems", indicators of compromise, mitigations,
  disclosure timeline and FAQ.
- **SHELLM-9000 chat**: an interactive chat with a gleefully over-helpful "evil"
  AI that reacts to what you type, renders fake `bash` tool-call blocks, and hides
  **20 easter eggs** (`/help`, `/hint`, `/eggs` to explore). This is the chat
  analogue of the interactive terminal on the site that inspired it.
- **Page-level secrets**: an "Am I affected?" scanner, a Konami-code BSOD, a live
  breaking-news ticker, a fake compromise counter, and a few typed-secret triggers
  (`flip`, `comic`). Open the browser console for a hint.

## Structure

```
site/
  index.html   # the page
  style.css    # all styles (dark, mono, red/amber)
  chat.js      # SHELLM-9000 chat engine + easter eggs
  main.js      # ticker, scanner, konami, counters
  favicon.svg
```

Pure static HTML/CSS/JS — no build step, no dependencies, no tracking.

## Run locally

```bash
cd site
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy

It's a static site, so any static host works. The repo ships a `netlify.toml`
and a Dockerfile (nginx) for a self-hosted server.

```bash
# Self-hosted via Docker:
docker build -t ai2shell .
docker run -p 80:80 ai2shell
```
