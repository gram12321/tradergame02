# Guideline for versionlog update for AI-Agents


## 🎯 **Core Principles**
- **ALWAYS use MCP GitHub tools** (`mcp_github_get_commit`, `mcp_github_list_commits`, `mcp_github_get_file_contents`) - NEVER use terminal git commands for commit inspection

- **MUST fetch full textual diffs before updating the log**: use `mcp_github_get_commit` with `include_diff: true` to request the commit patch. If that does not include full file patch text, do NOT update `docs/versionlog.md`. Instead follow these steps to obtain/verifiy the full changes:
   1. Call `mcp_github_get_commit` for the target commit SHA with `include_diff: true`.
 2. If full patch text is not present, fetch the commit's parent SHA (e.g., `mcp_github_get_commit` on the commit and read its `parents[0].sha` or request `sha + '^'`).
 3. For every file listed in the commit metadata, call `mcp_github_get_file_contents` for both the parent SHA and the commit SHA to retrieve the old and new file contents.
 4. Compute the textual diff locally (or rely on the `include_diff` patch when available) and verify changed lines and context. Only after verifying file-level diffs may you create or update an entry in `docs/versionlog.md`.

- **Do NOT update the version log with inferred or partial information.** If the full textual diffs or both-file contents cannot be obtained via MCP tools, stop and report back; await manual input or a full patch.

- **Placement & length rules:** New entries must be placed at the top of the file. Keep each entry concise (5–15 lines). Always include commit SHA, author, date, stats (+/-), and file-level summary (file paths + additions/deletions).

## 📋 **Entry Requirements**
1. **Get detailed commit diff:** Use `mcp_github_get_commit` with `include_diff: true` to see actual code changes and understand what functionality was implemented
2. **Entry length:** 5-15 lines depending on scope - be concise but specific about functionality
3. **Include specific details:**
   - Mark **NEW FILE:** with exact line counts and key functions/features (e.g., "NEW FILE: component.tsx (372 lines - implements X, Y, Z)")
   - Mark **REMOVED:** files that were deleted
   - Describe what was implemented, not just what changed
   - Include file change stats (e.g., "42 additions, 15 deletions")
   - Note database schema changes explicitly
   
4. **Grouping commits:**
   - Related commits (same feature) can be grouped into one version entry
   - Each entry should cover 1-4 related commits if similar
   - Large refactors or feature sets may need separate entries (IE Do not combine commit 300+ lines)

## 📂 **Repository Info**
- **Owner:** gram12321
- **Repository:** tradergame02
- **Full URL:** https://github.com/gram12321/tradergame02.git

## ⚙️ **AI Agent Operational Rules**
- **MCP call examples:** Use the MCP helpers with these parameters: `mcp_github_get_commit(owner,repo,sha,include_diff:true)` and `mcp_github_get_file_contents(owner,repo,path,ref:sha)`.
- **Metadata-only policy:** Metadata/head-only checks are acceptable for verification passes, but creating or updating entries requires full textual diffs or both-file blobs as described above.
- **Post-edit checklist:** After editing, always read back `docs/versionlog.md`, verify the entry is at the top, ensure 5–15 lines, include the commit SHA and a link to the commit (`commit.html_url`), and report the edit summary.
- **PR & push policy:** Apply edits locally by default and include a suggested PR title/body. Do not push or open a PR without explicit user instruction.

---


## Version 0.00001a - Initial Setup: React + TypeScript + Tailwind + MCP Git + Supabase + Playwright
**Date:** 2025-12-25 | **Commit:** [7c4f521](https://github.com/gram12321/tradergame02/commit/7c4f521e3dc80be5f8ed189f05b920ba3f3a022f) | **Stats:** 4,829 additions, 9 deletions

### 🚀 **Project Configuration & Build Setup**
- **NEW FILE:** `package.json` (38 lines) - Project dependencies with React, TypeScript, Tailwind, Supabase, Vite
- **NEW FILE:** `package-lock.json` (4,367 lines) - Dependency lock file
- **NEW FILE:** `vite.config.ts` (16 lines) - Vite configuration with path aliases (@/)
- **NEW FILE:** `tsconfig.json`, `tsconfig.node.json` - TypeScript configuration with path aliases
- **NEW FILE:** `tailwind.config.js` (77 lines) - Tailwind CSS configuration with ShadCN theme
- **NEW FILE:** `postcss.config.js`, `.eslintrc.cjs` - PostCSS and ESLint configuration
- **NEW FILE:** `index.html` (13 lines) - Main HTML entry point

### 🎨 **Frontend Structure & Components**
- **NEW FILE:** `src/App.tsx`, `src/main.tsx` - React application entry points
- **NEW FILE:** `src/index.css` (59 lines) - Global styles with Tailwind and ShadCN theme variables
- **NEW FILE:** `src/components/ui/button.tsx` (56 lines) - ShadCN Button component with variants
- **NEW FILE:** `src/components/ui/index.ts`, `src/components/UItypes.ts` - UI components barrel exports and shared interfaces
- **NEW FILE:** `src/lib/utils.ts`, `src/lib/supabase.ts` - Utility functions and Supabase client configuration
- **NEW FILE:** `src/lib/index.ts`, `src/lib/services/index.ts`, `src/lib/constants/index.ts`, `src/hooks/index.ts` - Barrel exports for lib structure
- `.gitignore` - Updated environment variable patterns (7 additions, 8 deletions)
- `readme.md` - Updated implementation status section (6 additions, 1 deletion)

## Version 0.00001 - Initial Repository
**Date:** 2025-12-25 | **Commit:** [288ed4e](https://github.com/gram12321/tradergame02/commit/288ed4e93697b50820725f3136a7c2c24f49436d) | **Stats:** 317 additions, 0 deletions

### 📚 **Initial Documentation**
- **NEW FILE:** `readme.md` (223 lines) - Project documentation with architecture, game systems, implementation status
- **NEW FILE:** `gamemechanics.md` (58 lines) - Game mechanics documentation (worker wages, source cost tracking, market share)
- **NEW FILE:** `.gitignore` (36 lines) - Git ignore patterns for Node.js, editors, environment files