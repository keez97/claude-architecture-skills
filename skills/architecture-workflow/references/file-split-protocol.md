# File Split Protocol

Splitting large files into smaller modules is one of the most dangerous refactoring
operations. Unlike renaming a variable or extracting a function, file splits touch
every import in the codebase, change module boundaries, and can silently corrupt code
if done carelessly. This protocol exists because a naive text-based split of a 2,941-line
TypeScript API client destroyed an entire frontend — function bodies separated from
declarations, interfaces truncated mid-definition, and orphaned code blocks scattered
across 14 broken files.

**The core principle: the original file is the source of truth until every split file
compiles independently and all imports resolve.**

---

## Rules

### 1. Never Split by Line Ranges

Splitting a file by saying "lines 1-200 go to file A, lines 201-400 go to file B" is
the most common way to corrupt code. Functions span line ranges. Interfaces have nested
blocks. A line-range cut will land in the middle of a function body, a type definition,
or a multi-line expression.

**Instead:** Identify complete, self-contained units (functions, classes, interfaces,
type blocks) and move them as whole units. Every unit must include its full declaration,
body, and closing brace/bracket.

### 2. AST-Aware or Manual — Never Regex

If you're splitting programmatically, use an AST parser (TypeScript: `ts-morph` or
`@typescript-eslint/parser`; Python: `ast` module; JavaScript: `@babel/parser`).
If you're splitting manually, move one complete unit at a time and verify after each move.

Never use regex or text search to identify split boundaries. `function foo(` might
appear in a comment, a string literal, or a nested scope.

### 3. Write → Verify → Then Delete

The order matters:

1. **Write** the new split file with the extracted code
2. **Add** all necessary imports to the new file
3. **Add** re-exports from the barrel/index file
4. **Verify** the new file compiles independently (`tsc --noEmit <file>` or equivalent)
5. **Verify** the full project builds (`npm run build` / `tsc` / `python -c "import module"`)
6. **Only then** remove the code from the original file
7. **Verify again** that the full project still builds

If step 4 or 5 fails, the split file is wrong. Fix it before proceeding. Never delete
from the original until the new file is proven correct.

### 4. Preserve the Original Until Proven

The original monolithic file must remain intact and functional until every split file
has been verified. Think of it as a database migration: the old schema stays until the
new one is proven.

If something goes wrong mid-split, you can always revert to the original. If you've
already deleted from the original, you're in a corrupted state with no clean rollback.

### 5. Maximum 5 Files Per Split Round

Don't split a 3,000-line file into 14 modules in one operation. Split into 3-5 modules
per round:

- Round 1: Extract the 3-5 most independent modules (types, utilities, constants)
- Verify full build
- Git commit
- Round 2: Extract the next batch (service functions grouped by domain)
- Verify full build
- Git commit

Each round is a safe checkpoint. If round 2 breaks something, you revert to the
round 1 commit — not to the monolithic original.

### 6. Every Split File Must Compile Independently

After creating a split file, run the language-specific compilation check:

```bash
# TypeScript
npx tsc --noEmit path/to/new/file.ts

# Python
python -c "import path.to.new.module"

# JavaScript (with build tool)
npx esbuild path/to/new/file.js --bundle --outfile=/dev/null
```

If the file has unresolved imports, missing types, or syntax errors, it's not ready.
Fix it before moving on.

### 7. Barrel File (index.ts/\_\_init\_\_.py) Must Re-Export Everything

After splitting, the barrel file must re-export every public symbol from every split
file. Consumers who imported from the original monolithic file should not need to
change their imports.

```typescript
// index.ts — barrel re-exports
export * from './types';
export * from './client';
export * from './market';
export * from './portfolio';
// If the original had a default export:
export { default } from './client';
```

**Common pitfall:** `export *` does NOT forward default exports. If the original file
had `export default`, you need an explicit `export { default } from './source'`.

### 8. Git Checkpoint After Every Verified Round

After each split round passes full compilation:

```bash
git add <new-files> <modified-original> <barrel-file>
git commit -m "Split round N: extract <modules> from <original>"
```

This creates a clean rollback point. If the next round fails, you revert to this commit
instead of trying to manually reconstruct a partially-split file.

---

## Pre-Split Checklist

Before starting any file split:

- [ ] File has been read completely (not just sampled)
- [ ] All exports have been cataloged (functions, classes, types, constants, default export)
- [ ] Dependency graph mapped (what imports what within the file)
- [ ] Split plan reviewed: each target file listed with its contents
- [ ] Git working tree is clean (no uncommitted changes)
- [ ] Full project builds successfully (baseline)

## Post-Split Verification

After completing all split rounds:

- [ ] Every split file compiles independently
- [ ] Full project builds (`npm run build` / `tsc` / `pytest`)
- [ ] All tests pass
- [ ] No import errors in any consumer file
- [ ] Barrel file re-exports every public symbol
- [ ] Original monolithic file is either deleted or reduced to a barrel
- [ ] Git commit with all changes

## When NOT to Split

Not every large file needs splitting. Consider leaving it monolithic if:

- It's a single cohesive module (one domain, one responsibility)
- Splitting would create circular dependencies between the new files
- The file is large but stable (rarely changed, few merge conflicts)
- The split would require consumers to change their imports (breaking change)
- You don't have compilation/build verification available

A 3,000-line file that works is better than 14 broken 200-line files.

---

## Recovery

If a split has already corrupted the codebase:

1. **Don't try to fix the split files.** If multiple files are broken, the fastest
   recovery is restoring the original.
2. **Find the pre-split commit:** `git log --oneline -- <original-file>`
3. **Restore the original:** `git show <commit>^:<path/to/original> > <path/to/original>`
4. **Remove the broken split files**
5. **Verify the project builds**
6. **Commit the restoration**
7. **Then re-attempt the split** using this protocol
