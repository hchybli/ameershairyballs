# @backstop/integrations

L4 adapter pattern. **Phase 1:** CSV only.

## Adapters

| Adapter | File | Status |
|---------|------|--------|
| CSV Dentrix export | `csv-dentrix.ts` | Port from legacy |
| CSV 835 simplified | `csv-835.ts` | Port from legacy |
| Dentrix API | — | Phase 4 |
| Clearinghouse | — | Phase 4 |

## Interface

```typescript
export interface IngestAdapter {
  parse(input: string): Promise<CanonicalClaim[]>;
}
```
