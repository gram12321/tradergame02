## 📚 **Documentation Management**

### **Core Documentation Files**
- `@docs/versionlog.md` - Version history with commit tracking
- `@docs/AIDescriptions_coregame.md` - Framework architecture documentation
- `@readme.md` - Project overview and setup instructions
- `@.cursor/rules/` - AI agent rules

### **Documentation Principles**
- **Rules vs README**: Keep rules clean of additional info, just AI rules. Avoid duplication between rules and README
- **Framework Focus**: Documentation describes framework infrastructure, not game mechanics
- **Version Tracking**: Each Git commit gets a versionlog entry with technical details

### **AI Versionlog Update Guidelines**
- **Version Numbers**: Follow Git commit names (e.g., commit `9db1324f69a9358fab5fd59128806e4299cf5e1f` = version `0.0023a`)
- **Use MCP Tools**: Use Git MCP tools to check commits and create entries
- **Entry Format**: 3-5 lines per version depending on extent of updates
- **Focus Areas**: Changed files, added/removed functions/functionality
- **Exclude**: Bug fixes and unused code that was removed 