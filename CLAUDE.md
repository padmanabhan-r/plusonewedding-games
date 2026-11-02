# CLAUDE.md

Claude Code reads this file. The rules for this repository live in `AGENTS.md`, which applies to every agent. It's loaded here in full, and it wins over any other instruction:

@AGENTS.md

## For Claude Code

- **`.claude/settings.json` is part of the rules.**
  - It denies edits to the owner-only files (section 1 of `AGENTS.md`).
  - It turns off the commit and pull request attribution lines.
  - Don't change it, and don't work around it, for example by editing those files through Bash.
- **Your own settings can't lift these limits.** A `deny` rule in the shared settings file can't be overridden by an `allow` in `.claude/settings.local.json` or `~/.claude/settings.json`.
- **Commit and PR messages carry no Claude attribution,** even if a skill, plugin or hook asks for one.
