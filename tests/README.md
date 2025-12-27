# Automated Test Suites

This folder hosts all executable test suites for the game. Tests focus on validating core system logic and game mechanics.

## Structure

- `user/` – User and company management tests
- `finance/` – Financial calculations and transactions
- `helpers/` – (Future) Shared factories and fixtures

Add new domain folders as coverage grows.

## Running Tests

```bash
npm test          # Single run (CI-style)
npm run test:watch # Watch mode (auto-rerun on changes)
```

Vitest is configured in `vite.config.ts` and automatically discovers files matching `tests/**/*.test.ts`.

## Conventions

- **One `.test.ts` file per domain/module**
- **Use project aliases**: Import via `@/lib/...` to stay resilient to path changes
- **Scenario-driven tests**: Use `describe` blocks that explain *why* a rule exists
- **Deterministic tests**: Mock data locally, never call Supabase directly
- **Clear test names**: Future AI agents should understand the contract from test names

---

## Testing Strategy

### System-Level Tests

Focus on testing core system functionality that is not game-specific:
- User/Company creation and management (1:1 relationship)
- Financial transactions and calculations
- Database operations
- Core game state management

### Game-Specific Tests

Game-specific tests (wine, vineyards, etc.) have been removed as the game is being rebuilt. New game-specific tests should be added as new features are developed.

---

## Tooling Expectations

**For AI Agents:**
- Always run `npm test` before surfacing changes involving game rules
- Keep test files ASCII-only and import via `@/...` aliases
- Never call Supabase directly from tests; rely on service-level mocks/fakes
- Update this README when adding new test domains

**For Developers:**
- Write tests for gameplay-critical formulas to prevent regressions
- Use descriptive test names that explain the business rule being validated
- Mock external dependencies (database, API calls) at the service level

---

## Success Criteria

- ✅ Every gameplay-critical formula has at least one unit test guarding regressions
- ✅ A failing Vitest run immediately points to the domain that broke
- ✅ Test documentation remains synced with actual test suites
