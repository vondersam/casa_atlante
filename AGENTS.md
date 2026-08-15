# Casa Atlante (Next.js)

## Overview
- Marketing and booking website for Casa Atlante (holiday home rental).
- Next.js App Router app with API routes under `src/app/api`.
- Deployed to Vercel (see `README.md` for the live URL).

## Structure
- `src/app`: App Router pages, layouts, and route segments.
- `src/app/api`: API routes (availability, cron, booking requests).
- `src/lib`: Supabase client and availability sync utilities.
- `public`: Static assets.

## Commands
- `npm run dev`: Run the Next.js dev server.
- `npm run build`: Production build.
- `npm run start`: Start the production server.
- `npm run lint`: Run Next.js lint rules.

## Environment
- Node.js 24.x (see `package.json` engines).
- Expected env vars (typically in `.env.local`):
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `AIRBNB_ICAL_URL`, `BOOKING_ICAL_URL`
  - `CRON_SECRET`, `WEBHOOK_SECRET`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`
  - `BOOKING_REQUEST_TO` (default: `booking@casa-atlante.com`)

## Software Development Standards

- Keep changes small, focused, and consistent with the existing architecture and naming conventions; avoid unrelated refactors.
- Prefer clear, maintainable TypeScript with explicit types at module and API boundaries. Avoid `any`, unsafe casts, and non-null assertions unless they are justified.
- Follow Next.js App Router conventions. Use Server Components by default, add `"use client"` only when browser APIs or interactivity require it, and keep secrets and privileged operations on the server.
- Validate and normalize all external input at system boundaries, including route parameters, request bodies, environment variables, webhook payloads, and third-party responses.
- Treat authentication, authorization, and secret handling as mandatory concerns. Never expose service-role keys or other credentials to client bundles, logs, source control, or error responses.
- Make API routes predictable: return appropriate HTTP status codes and stable response shapes, handle expected failures explicitly, and log enough context to diagnose errors without recording sensitive data.
- Preserve accessibility and responsive behavior in UI changes. Use semantic HTML, keyboard-operable controls, visible focus states, meaningful alternative text, and sufficient color contrast.
- Avoid unnecessary client-side JavaScript, network requests, and large dependencies. Optimize images and other assets using the framework's supported mechanisms.
- Add or update tests when a test framework covers the changed area. Because this repository currently has no test suite, perform targeted manual verification and run `npm run lint` and `npm run build` for code changes.
- Document new environment variables, API contracts, operational steps, and non-obvious design decisions. Keep dependencies minimal and review their maintenance, security, and bundle-size impact before adding them.
- Do not commit secrets, generated build output, local environment files, or `.gitnexus/` contents.

### Refactoring and Code Smells

The following guidance summarizes Martin Fowler's [Code Smell](https://martinfowler.com/bliki/CodeSmell.html) article and *[Refactoring: Improving the Design of Existing Code](https://martinfowler.com/books/refactoring.html)*:

- Treat a code smell as a prompt to investigate a possible design problem, not as proof that the code is wrong. Evaluate the surrounding context before changing it.
- Refactor by making small, behavior-preserving transformations. Keep the application working after each step and verify behavior frequently.
- Separate structural cleanup from feature changes and bug fixes when practical. Establish or improve characterization tests before refactoring risky or poorly understood behavior.
- Refactor as part of normal development: prepare the code before a change when its current structure makes the change difficult, and improve clarity after the behavior works.
- Prefer names that communicate intent. Rename unclear variables, functions, components, and types rather than relying on comments to explain confusing code.
- Watch for duplicated logic, long functions, large modules, and deeply nested conditionals. Extract cohesive functions or modules and simplify control flow when doing so improves understanding.
- Keep related data and behavior together. Investigate data clumps, primitive values carrying domain meaning, classes or objects with data but no useful behavior, and functions that are more interested in another module's data than their own.
- Minimize change amplification. Divergent responsibilities in one module and a single responsibility scattered across many modules are signals to reconsider boundaries and move behavior closer to the data it uses.
- Reduce unnecessary coupling and indirection. Investigate long call chains, excessive delegation, global or mutable shared state, and APIs that expose more internal detail than callers need.
- Remove dead code, speculative abstractions, premature extension points, and parameters that no longer serve current requirements. Do not create abstractions solely to eliminate superficial similarity.
- Use established refactoring mechanics—such as extract, inline, move, rename, encapsulate, and decompose conditional—but choose the smallest technique that addresses the diagnosed problem.
- Do not combine refactoring with observable behavior changes under the same claim. If behavior must change, make that change explicit and verify it separately.

## Notes
- Cron endpoint requires `CRON_SECRET` authorization (see `README.md`).
- No test suite is defined in `package.json`.


## GitNexus

GitNexus is the required code-intelligence system for this repository.

Before investigating or modifying code, check the GitNexus repository context or run `npx -y gitnexus@X.Y.Z status`. If the index is missing or stale, run `npx -y gitnexus@X.Y.Z analyze`. Use GitNexus query for architectural discovery, context before changing shared symbols, impact before changing public APIs or widely used symbols, and detect_changes before completing substantial changes. Never commit files under `.gitnexus/`.
