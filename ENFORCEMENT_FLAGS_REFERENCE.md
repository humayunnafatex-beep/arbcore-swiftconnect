# Enforcement Flags Reference

Use this reference before changing any access, permission, tenant, or provider routing enforcement flag.

Production Enterprise Beta defaults should remain `false` until staging tests pass.

## AUTH_ENFORCED

Default:

```env
AUTH_ENFORCED=false
```

What it does:

- When false, Enterprise Beta/demo fallback access remains available.
- When true, protected app access requires a valid mapped auth session.

When to enable:

- Local or staging auth enforcement tests.
- Production only after `/auth/status` shows a mapped `OWNER` or `ADMIN`.

When not to enable:

- Before Supabase Auth user mapping is verified.
- Before rollback access is planned.
- If public webhook routes might be accidentally blocked.

Rollback value:

```env
AUTH_ENFORCED=false
```

## PERMISSIONS_ENFORCED

Default:

```env
PERMISSIONS_ENFORCED=false
```

What it does:

- When false, permission guards report readiness but do not block current beta users.
- When true, role permission checks can block unauthorized actions.

When to enable:

- Local or staging role-based access tests.
- Production only after `/auth/permissions` confirms expected `OWNER`, `ADMIN`, `MANAGER`, and `AGENT` behavior.

When not to enable:

- Before auth enforcement and user mapping are stable.
- Before role expectations are agreed with the business.

Rollback value:

```env
PERMISSIONS_ENFORCED=false
```

## TENANT_MEMBERSHIP_ENFORCED

Default:

```env
TENANT_MEMBERSHIP_ENFORCED=false
```

What it does:

- When false, tenant membership checks are report-only.
- When true in a future enforcement phase, users should access only allowed company/workspace contexts.

When to enable:

- Local or staging tenant isolation tests.
- Production only after `/auth/tenant-access` confirms mapped user-company access and workspace switching behavior is safe.

When not to enable:

- Before tenant membership staging tests pass.
- Before client workspace owner/admin mapping is verified.
- While relying on beta workspace cookie switching as a security boundary.

Rollback value:

```env
TENANT_MEMBERSHIP_ENFORCED=false
```

## STRICT_PROVIDER_WEBHOOK_ROUTING

Default:

```env
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

What it does:

- When false, unmatched provider webhooks may use the Enterprise Beta fallback.
- When true, unmatched WhatsApp/Messenger provider webhooks are acknowledged but not processed into the default workspace.

When to enable:

- Local or staging provider routing tests.
- Production only after every live workspace has correct, unique provider IDs and `/admin/provider-diagnostics` shows no duplicates.

When not to enable:

- Before provider IDs are mapped and verified.
- Before webhook matched/unmatched behavior is tested.
- If a live beta number/page still depends on fallback routing.

Rollback value:

```env
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```
