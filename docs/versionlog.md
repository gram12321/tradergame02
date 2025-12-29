# Guideline for versionlog update for AI-Agents

## 🎯 **Core Principles**
- **ALWAYS use MCP GitHub tools** (`mcp_github2_get_commit`, `mcp_github2_list_commits`) - NEVER use terminal git commands
- **ALWAYS retrieve actual commit data** - Don't guess or assume what changed
- **Verify existing entries** against actual commits before adding new ones

## 📋 **Entry Requirements**
1. **Use `mcp_github2_get_commit` with `include_diff: true`** to get exact file changes and stats
2. **Include specific details:**
   - Mark **NEW FILE:** with exact line counts (e.g., "NEW FILE: component.tsx (372 lines)")
   - Mark **REMOVED:** files that were deleted
   - Include file change stats (e.g., "42 additions, 15 deletions")
   - Note database schema changes explicitly
   
3. **Grouping commits:**
   - Related commits (same feature) can be grouped into one version entry
   - Each entry should cover 1-4 related commits if similar
   - Large refactors or feature sets may need separate entries

## 📂 **Repository Info**
- **Owner:** gram12321
- **Repository:** tradergame02
- **Full URL:** https://github.com/gram12321/tradergame02.git

---

## Version History

*Version history will be added here as development progresses.*
