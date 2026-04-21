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

## Why this rule exists (2-level hierarchy)

The original schema used a recursive `folder` table where any folder could contain any other folder or a test case. In practice that produced:

- Inconsistent tree depths across projects (some users nested 5 deep, some 1).
- Complex UI to render arbitrary trees + breadcrumb logic.
- Display-ID generation required walking the ancestor chain at every insert.
- Display IDs were unstable when folders were moved.

QA practice at Athena converged on a mental model of **Category (area of the app) → Subcategory (feature within the area) → Test Cases**. The recursive model was strictly more expressive than needed, so migration `004` dropped it in favor of the flat two-level schema.

**Benefits of the flat model:**

- Predictable tree depth → simpler UI (the grouped accordion in `TestCycleDetailPage` is two levels, period).
- Stable display IDs (no re-numbering on move).
- Cheaper queries — one join, no recursive CTEs.
- Matches how QA engineers actually think about tests.

**Tradeoff:** Users who wanted deep nesting must flatten their structure; CSV imports must emit both `Category` and `Subcategory` columns.
