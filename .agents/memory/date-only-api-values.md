---
name: Date-only API values
description: Date fields cross the database, OpenAPI client, and browser with different runtime representations.
---

Calendar-only fields may arrive in the browser as ISO timestamps even when their TypeScript contract is a string. Normalize them to the first ten characters before using them in date inputs or constructing date-only display values.

**Why:** PostgreSQL date columns and OpenAPI date coercion can serialize differently across the server/client boundary, and appending a time suffix to an already timestamp-shaped string produces an invalid date.

**How to apply:** Keep server validation on `YYYY-MM-DD` keys, and make client date formatters/forms accept both `YYYY-MM-DD` and ISO timestamp strings.