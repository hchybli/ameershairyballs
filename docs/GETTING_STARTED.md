# Getting started with Cursor

A step-by-step guide for **@ameerabouhouli** and **@hchybli** to open this project in Cursor and start building together.

## Prerequisites

Install these once on your machine:

| Tool | Why | Install |
|------|-----|---------|
| **Git** | Clone and sync the shared repo | [git-scm.com](https://git-scm.com/) |
| **Node.js 20+** | Next.js runtime (needed soon) | [nodejs.org](https://nodejs.org/) |
| **Cursor** | AI-powered editor | [cursor.com](https://cursor.com/) |

Optional but recommended: a [GitHub](https://github.com) account with access to this repo.

---

## Step 1 — Clone the repo

If you don't have it locally yet:

```bash
cd ~/projects   # or wherever you keep code
git clone https://github.com/hchybli/ameershairyballs.git
cd ameershairyballs
```

If **ameer** already has it at a different path, that's fine — just make sure `git remote -v` shows:

```
origin  https://github.com/hchybli/ameershairyballs.git
```

---

## Step 2 — Open in Cursor

1. Launch **Cursor**
2. **File → Open Folder…**
3. Select the `ameershairyballs` folder (the one that contains `README.md`)
4. You should see the file tree on the left: `README.md`, `PROJECT_OVERVIEW.md`, `docs/`, etc.

---

## Step 3 — Your first AI chat

Cursor has a chat panel (usually on the right, or `Cmd+L` / `Ctrl+L`).

### Attach the project spec

Type `@` in the chat box. You'll see a file picker. Choose **PROJECT_OVERVIEW.md**.

Example first prompt:

```
@PROJECT_OVERVIEW.md

We're starting Phase 0. Scaffold a Next.js 14 app with TypeScript, Tailwind,
and shadcn/ui. Add a basic folder structure matching our data model.
Use synthetic data only — no PHI.
```

The `@` symbol tells the AI to **read that file** before answering. Always attach `PROJECT_OVERVIEW.md` for feature work.

### Agent vs Ask mode

| Mode | When to use |
|------|-------------|
| **Agent** | "Build this", "create files", "fix this bug" — AI can edit files and run commands |
| **Ask** | "Explain this", "what does X mean?" — read-only, no changes |

For scaffolding the app, use **Agent** mode.

---

## Step 4 — How Cursor rules work

This repo includes `.cursor/rules/project.mdc`. Cursor loads it automatically so the AI knows:

- We're building Backstop (dental billing, Stage 1 only)
- Use CDT codes, not CPT
- No real PHI, synthetic data only
- `outcomes` and `fixes` are append-only

You don't need to paste those rules every time — they're always on.

---

## Step 5 — Sync with your collaborator

After you (or the AI) create files:

```bash
git status                  # see what changed
git add .
git commit -m "Add project docs and Cursor rules"
git push origin main
```

Your collaborator then runs:

```bash
git pull origin main
```

In Cursor: **Source Control** panel (branch icon on the left) shows diffs and lets you commit without the terminal.

---

## Step 6 — Verify the shared repo

Both collaborators should complete [VERIFY_SHARED_REPO.md](./VERIFY_SHARED_REPO.md). It takes about 5 minutes and confirms clone → edit → push → pull works for both of you.

---

## Common Cursor shortcuts (Mac)

| Shortcut | Action |
|----------|--------|
| `Cmd+L` | Open chat |
| `Cmd+I` | Inline edit in file |
| `Cmd+Shift+P` | Command palette |
| `Cmd+P` | Quick open file |

Windows/Linux: use `Ctrl` instead of `Cmd`.

---

## What to build first (Phase 0)

Once the shared repo is verified, agree with your collaborator, then ask the AI:

```
@PROJECT_OVERVIEW.md

Implement Phase 0:
1. Next.js 14 app scaffold
2. Supabase schema for clinics, claims, claim_lines (see data model)
3. CSV ingest endpoint with synthetic sample data
4. .env.example with required keys (no real secrets)
```

The AI will create files. Review the diff, test locally (`npm run dev`), then push and open a PR.

---

## Stuck?

- **"I don't see my collaborator's changes"** → run `git pull origin main`
- **"The AI built the wrong thing"** → attach `@PROJECT_OVERVIEW.md` and say which section it should follow
- **"Permission denied on push"** → ask @hchybli to add you as a collaborator on the GitHub repo (Settings → Collaborators)
