# Bug Fix: IndexedDB Key Range Error

## Issue
```
DataError: Failed to execute 'bound' on 'IDBKeyRange': 
The parameter is not a valid key.
```

## Root Cause
The Dexie schema was using compound indexes like `[userId+deletedAt]`, but `deletedAt` can be `null`, which is not a valid key for IndexedDB compound indexes.

## Solution

### 1. Updated Dexie Schema (v2)
Removed all compound indexes with nullable fields:
```typescript
// Before (v1 - broken)
"id, userId, deletedAt, [userId+deletedAt]"

// After (v2 - fixed)
"id, userId, deletedAt"
```

### 2. Updated Query Patterns
Changed all queries from compound `.where({ userId, deletedAt: null })` to:
```typescript
// Simple userId index query
db.table
  .where("userId")
  .equals(userId)
  .filter((item) => item.deletedAt === null)
```

### 3. Files Modified
- `src/lib/db/dexie.ts` - Schema version bumped to v2
- `src/lib/db/repository.ts` - All query methods updated
- `src/lib/db/hooks.ts` - All React hooks updated
- `src/lib/db/seed.ts` - Seed and clear methods updated

## Migration
Dexie automatically handles the migration from v1 → v2. Existing data is preserved.

Users can clear their browser's IndexedDB manually if needed:
1. Open DevTools
2. Application → Storage → IndexedDB
3. Right-click "RunwayDB" → Delete

## Testing
✅ TypeScript compiles with no errors  
✅ All queries work with simple indexes  
✅ Soft-delete filtering works correctly  
✅ No compound index errors

## Performance Impact
Minimal - filtering `deletedAt` in memory after indexed userId query is efficient for typical dataset sizes (thousands of records per user).

For very large datasets (100k+ records), could add a separate index on `deletedAt` alone if needed, but not necessary for MVP.
