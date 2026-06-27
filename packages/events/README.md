# @backstop/events

Append-only event emit, projectors, replay.

## Key APIs (planned)

```typescript
emitEvent(input: EmitEventInput): Promise<string> // event id
projectEvent(event: StoredEvent): Promise<void>
replayClaim(tenantId: string, claimId: string): Promise<ClaimState>
```

## Workstream

WS-02

## Tests required

- emit → project → read model state
- override appends to flags_resolved, removes from flags_open
