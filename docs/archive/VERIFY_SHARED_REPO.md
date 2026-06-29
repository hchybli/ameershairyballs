# Verify shared repo

Run this checklist **once per collaborator** to confirm the GitHub repo works for both **@hchybli** and **@ameerabouhouli**.

Expected time: ~5 minutes.

---

## Prerequisites

- [ ] Git installed (`git --version`)
- [ ] GitHub account with access to [hchybli/ameershairyballs](https://github.com/hchybli/ameershairyballs)
- [ ] Cursor installed and repo folder open

---

## Test 1 — Clone (or pull)

**If this is your first time:**

```bash
git clone https://github.com/hchybli/ameershairyballs.git
cd ameershairyballs
ls README.md PROJECT_OVERVIEW.md
```

**If you already have the repo:**

```bash
cd ameershairyballs
git pull origin main
ls README.md PROJECT_OVERVIEW.md
```

- [ ] `README.md` and `PROJECT_OVERVIEW.md` exist
- [ ] No error from `git pull`

---

## Test 2 — Remote is correct

```bash
git remote -v
```

Expected:

```
origin  https://github.com/hchybli/ameershairyballs.git (fetch)
origin  https://github.com/hchybli/ameershairyballs.git (push)
```

- [ ] Remote URL matches above

---

## Test 3 — Create a marker file (each person does this once)

Pick **your** file — don't edit your collaborator's:

| Collaborator | Create this file |
|--------------|------------------|
| @hchybli | `docs/collaborators/hchybli.md` |
| @ameerabouhouli | `docs/collaborators/ameer.md` |

**@hchybli** runs:

```bash
mkdir -p docs/collaborators
cat > docs/collaborators/hchybli.md << 'EOF'
# hchybli

- Verified shared repo access
- Date: (fill in)
EOF
git add docs/collaborators/hchybli.md
git commit -m "Verify shared repo access (hchybli)"
git push origin main
```

**@ameerabouhouli** runs (after pulling hchybli's commit if needed):

```bash
git pull origin main
mkdir -p docs/collaborators
cat > docs/collaborators/ameer.md << 'EOF'
# ameer

- Verified shared repo access
- Date: (fill in)
EOF
git add docs/collaborators/ameer.md
git commit -m "Verify shared repo access (ameer)"
git push origin main
```

- [ ] Push succeeded without permission errors
- [ ] Other person can `git pull` and see your file

---

## Test 4 — Collaborator sees your changes

The **other** person runs:

```bash
git pull origin main
ls docs/collaborators/
cat docs/collaborators/hchybli.md   # or ameer.md
```

- [ ] Both files exist in `docs/collaborators/`
- [ ] Content looks correct

---

## Test 5 — GitHub web UI

1. Open https://github.com/hchybli/ameershairyballs
2. Browse to `docs/collaborators/`

- [ ] Both marker files visible on GitHub
- [ ] Commit history shows both authors

---

## Pass criteria

| Test | @hchybli | @ameer |
|------|----------|--------|
| Clone / pull | ☐ | ☐ |
| Remote correct | ☐ | ☐ |
| Push marker file | ☐ | ☐ |
| Pull partner's file | ☐ | ☐ |
| Visible on GitHub | ☐ | ☐ |

When all boxes are checked for both people, the shared repo is working. Move on to [GETTING_STARTED.md](./GETTING_STARTED.md) Phase 0.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Permission denied (publickey)` | Set up [SSH keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) or use HTTPS with a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) |
| `rejected — non-fast-forward` | Run `git pull origin main` first, resolve conflicts, then push |
| Can't see repo on GitHub | Repo owner (@hchybli) adds collaborator under **Settings → Collaborators** |
| Push works but partner can't pull | Partner may be on a different remote URL — check `git remote -v` |
