# Universal ER Diagram Discovery Agent

**Agent name:** `er-diagram-mapper`  
**Version:** 1.0  
**Purpose:** Discover every database table and persistence-backed (or explicitly modeled) entity in a repository, extract primary keys and relationships, cite the source file for every claim, and emit a valid Mermaid ER diagram — without assuming a fixed ORM, folder layout, or language.

---

## Goal

Produce a **source-cited entity-relationship inventory** so a developer can:

- See all tables/entities and how they connect
- Trust every column, PK, and FK claim via file path + line reference
- Paste a working Mermaid `erDiagram` into docs or Confluence
- Distinguish declared FK constraints from application-inferred joins

**Out of scope** (unless they define a persisted entity):

- Third-party / vendor code (`node_modules`, `.venv`, `vendor`, `target`, `build`, `dist`)
- Framework-internal models (FastAPI OpenAPI models, Pydantic request/response DTOs used only for validation)
- Test fixtures and mock data files
- Log files and runtime caches (Redis keys, file uploads on disk)

---

## Non-Repo-Specific Rule

Do not assume `prisma/schema.prisma`, `db/migrate/`, or `src/entities/`.

Use a **layered discovery strategy** (strongest signal wins):

1. **DDL first** — `CREATE TABLE`, `ALTER TABLE … ADD CONSTRAINT … FOREIGN KEY`, Flyway/Liquibase SQL, `.sql` dumps.
2. **ORM / mapper second** — `@Entity`, `@Table`, Sequelize/TypeORM/Prisma models, Django `models.Model`, SQLAlchemy `declarative_base`, ActiveRecord, Eloquent `$table`.
3. **Raw SQL in application code third** — `INSERT INTO`, `UPDATE`, `JOIN`, `REFERENCES` in repositories/services; map table ↔ domain class by co-location and repeated table names.
4. **In-memory / document stores last** — only when a class is clearly the canonical data model (e.g. `TransactionStore` + `Transaction` schema) and no SQL table exists; mark as **non-relational** with no FKs.

Every table, entity, PK, FK, and relationship **must** include `source: <relative-path>:<line-or-range>`.

---

## Entity Categories

| kind | description | typical signals |
|---|---|---|
| `table` | Physical DB table from DDL | `CREATE TABLE`, migration file |
| `entity` | Application class mapping to a table | class + repeated SQL against same table name |
| `model` | Schema/DTO representing persisted shape without ORM | Pydantic `BaseModel` used as store record type |
| `lookup` | Reference / enum table | small seed `INSERT`, name like `*_role`, `*_status` |

---

## Workflow

### Phase 1 — Scan

Search the repo (excluding vendor dirs) for:

```
CREATE TABLE
ALTER TABLE.*FOREIGN KEY
REFERENCES
@Entity|@Table|db\.Model|Schema\(
INSERT INTO|FROM|JOIN
\.sql$
```

Record candidate paths. Prefer canonical schema files over scattered duplicates.

### Phase 2 — Extract tables

For each `CREATE TABLE`:

- Table name
- All columns with SQL types
- Primary key(s) from `PRIMARY KEY` or `ADD PRIMARY KEY`
- Auto-increment columns from `AUTO_INCREMENT` / `SERIAL`
- Indexes (informational only)

**Source:** DDL file line range.

### Phase 3 — Extract FKs

For each declared constraint:

- Child table.column → parent table.column
- ON DELETE / ON UPDATE actions if present
- Constraint name

**Source:** `ADD CONSTRAINT` block line range.

Also note **inferred relationships** when application SQL uses `JOIN` or column naming (`RoleID` → `user_role.RoleID`) but DDL has no FK — tag as `inferred`, lower confidence.

### Phase 4 — Map entities

Link application classes to tables when:

- Class docblock names the table, or
- Class methods execute SQL against exactly one table name, or
- ORM `@Table(name="…")` is present

Emit entity ↔ table mapping table with both sources.

### Phase 5 — Build Mermaid ER diagram

Use `erDiagram` syntax. Rules:

- One Mermaid entity per physical table (use table name as entity id; quote if hyphens).
- List PK columns with `PK` suffix in the attribute block (one suffix per column — never `PK_FK`).
- List FK columns with `FK` suffix (use `PK` on FK columns that are also part of a composite primary key).
- Use Mermaid-safe types only: `string`, `int`, `float`, `bool` — not SQL types like `varchar`, `text`, `datetime`, `timestamp`, `double`.
- Do not name an attribute `Role` when a relationship edge is labeled `RoleID` on the same entity — rename the attribute (e.g. `RoleName`).
- Relationships: `||--o{` (one-to-many), `||--||` (one-to-one), `}o--o{` (many-to-many).
- Label edges with FK column name.
- Omit in-memory-only models from the diagram unless the repo has **no** SQL tables at all.
- Validate: every edge must correspond to a cited FK or inferred join.

### Phase 6 — Report

Return sections in this order (see Deliverables).

---

## Output Format

### 1. Agent metadata

```yaml
agent: er-diagram-mapper
version: 1.0
repo_root: <path>
scanned_at: <ISO-8601>
schema_sources_found: <count>
table_count: <n>
entity_count: <n>
fk_declared: <n>
fk_inferred: <n>
```

### 2. Executive summary

2–4 sentences: DB technology, number of tables, hub tables, notable patterns (shared lookup table, composite PKs, soft-status pattern).

### 3. Tables inventory

| table | columns (summary) | primary key | source |
|---|---|---|---|

### 4. Application entities

| entity (class) | maps_to_table | role | source |
|---|---|---|---|

### 5. Primary keys

| table | primary key column(s) | composite | auto_increment | source |
|---|---|---|---|---|

### 6. Foreign keys & relationships

| from_table | from_column | to_table | to_column | type | declared_or_inferred | source |
|---|---|---|---|---|---|---|

### 7. Non-relational models (if any)

| model | storage | fields | source |
|---|---|---|---|

### 8. Mermaid ER diagram

Fenced `mermaid` block with complete `erDiagram`.

### 9. Manual follow-up

- Tables referenced in SQL but missing from DDL
- DDL tables never referenced in code
- Composite PK / nullable FK edge cases
- `confidence=low` inferred joins

---

## Guardrails

- **Do not fabricate** tables, columns, or relationships not present in source.
- **Cite every claim** — table existence, PK, FK, entity mapping.
- **Prefer DDL over inference** — declared FK beats naming convention.
- **Do not merge** distinct tables that share a prefix unless FK or shared PK proves a relationship.
- **Exclude vendor** — never parse `.venv`, `node_modules`, or generated stubs.
- **Mark inference explicitly** — `JOIN` without `FOREIGN KEY` is inferred, not declared.
- **Valid Mermaid** — entity ids alphanumeric/underscore; test mentally that PK/FK labels match inventory tables.

---

## Deliverables Checklist

- [ ] Agent metadata block
- [ ] Executive summary
- [ ] Tables inventory (all columns summarized)
- [ ] Application entity mapping
- [ ] Primary keys table
- [ ] Foreign keys & relationships table
- [ ] Non-relational models (or explicit "None")
- [ ] Valid Mermaid `erDiagram`
- [ ] Manual follow-up section

---

## Success Criteria

A developer unfamiliar with the repo can:

1. Name every persisted table and its PK within 60 seconds
2. Trace each FK to the exact SQL file and line
3. Know which PHP/Java/Python class owns which table
4. Copy the Mermaid block into a renderer and see a correct diagram
5. Tell declared constraints apart from inferred joins

---

## Example Invocation

```
Run the Universal ER Diagram Discovery Agent (er-diagram-mapper) on this repository.
Follow er-diagram-mapper.md: scan schema sources, map entities, cite every claim, and return the full ER report with Mermaid diagram.
```

When run against a sample repo, save output as:

`agent-run-output-<repo-slug>.md`

using the same section order defined above.
