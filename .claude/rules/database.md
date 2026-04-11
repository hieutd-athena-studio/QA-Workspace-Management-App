# Database & Repository Pattern

## Category / Subcategory Hierarchy

Strict 2-level structure:
- **Category:** Container only, no direct test cases. Belongs to a project.
- **Subcategory:** Holds test cases. Belongs to exactly one Category.
- **Test Cases:** Assigned only via `subcategory_id`.

Schema tables: `category`, `subcategory`, `test_case`, `test_cycle` (has `environment` column from migration 006)

**Migration 004** — dropped recursive `folder` table, created 2-level schema.  
**Migration 006** — adds `environment` to `test_cycle`. Both are idempotent (`PRAGMA table_info` guard).

## Repository Layer

- **One Repo per Entity:** `category.repo.ts`, `subcategory.repo.ts`, `test-case.repo.ts`, etc.
- **Computed Fields at DB Layer:** Display IDs, denormalized counts
- **Prepared Statements:** Parameterized queries only. No string concatenation.
- **Migrations:** Idempotency checks + transaction wrapping

```typescript
export class TestCaseRepo {
  create(dto: CreateTestCaseDTO) { /* insert + return with display_id */ }
  getBySubcategory(subcategoryId) { /* fetch test cases */ }
  generateDisplayId(subcategoryId) { /* join subcategory→category→project */ }
}
```

## Display IDs (Generated Once, Stored)

| Entity | Format | Source |
|--------|--------|--------|
| Test Case | `ARR-TC001` | subcategory→category→project.code |
| Test Plan | `ARR-PL001` | project.code |
| Test Cycle | `ARR-PL001-CY01` | plan display_id |
| Category / Subcategory | — | No display ID |

Compute at insert time in repository, not on-the-fly.

## Troubleshooting

- Check migrations ran via `src/main/database/connection.ts`
- Use better-sqlite3 syntax: `.all()`, `.get()`, `.run()`
- Verify foreign key constraints are enforced
