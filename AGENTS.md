# DASHBOARD YCX — CODEX REPOSITORY INSTRUCTIONS

## 1. Project Rules

This repository uses a unified Apple Design System V2 and strict engineering quality standards.

The existing project quality rules are located at:

`.agents/rules/dashboard-ycx-quality.md`

For full-project audits, UI modernization, Design System changes, architecture refactoring, and substantial code changes, read and apply that file before implementation.

Preserve the existing Antigravity Workspace Rules. Do not create a competing design system.

## 2. Single Source of Truth

Use the existing Design Tokens, Shared UI Components, Icon Registry, and established project conventions.

Follow:

**Primitive Tokens → Semantic Tokens → Component Tokens → Shared Components → Feature UI.**

Prefer modifying shared components and tokens over applying repeated local overrides.

One global design change must propagate consistently to all relevant consumers.

## 3. Apple Design System V2

Use Apple-inspired rounded interfaces and selective Liquid Glass.

Apply Glass primarily to navigation, floating controls, contextual toolbars, and appropriate overlays.

Keep data tables, KPIs, charts, reports, and long forms readable and performant.

Do not enable Dark Mode unless explicitly requested.

Preserve approved Vietnamese typography and business-specific visual conventions.

## 4. Safety and Business Logic

Never modify production data, Firebase permissions, authentication behavior, business formulas, or API contracts without verified justification and authorization.

Protect the existing LoginView V2 authentication behavior and regression tests.

Never run deployment, push, destructive database operations, or scripts that implicitly trigger them without explicit user approval.

Create safe local checkpoints before substantial changes.

Preserve uncommitted user modifications.

## 5. Audit Scope

For explicitly requested full-project audits:

- Inventory the complete repository.
- Distinguish discovered, reviewed, tested, and verified files.
- Track findings and affected consumers.
- Identify confirmed functional bugs, dead code, duplication, and Design System violations.
- Audit every applicable module and screen.
- Maintain progress and remaining-work records under `audit/`.
- Reconcile file coverage before reporting completion.

For ordinary small tasks, limit analysis to the relevant files and impacted consumers. Do not perform a full-repository audit unnecessarily.

## 6. Empirical Verification

Never claim a feature is verified without relevant evidence.

Run appropriate typecheck, unit, integration, E2E, build, and UI tests.

Do not use synthetic DOM insertion as proof of authentic React behavior.

Never hide failing tests, remove meaningful assertions, or confuse mocked tests with production verification.

Distinguish Chromium mobile emulation from real Safari on an iPhone.

Report PASS, FAIL, SKIPPED, and BLOCKED accurately.

## 7. Completion Criteria

Before reporting completion:

- List all changed files.
- Explain the root cause and fix.
- Identify impacted modules.
- Record test commands and results.
- Document unresolved issues and environment limitations.
- Ensure no unapproved deployment or push occurred.

For long-running projects, save progress checkpoints and continue from the last verified state.

Never claim full completion when the required scope remains partially reviewed or unverified.

## 8. Communication

Communicate plans, findings, progress, and final reports in Vietnamese.

Keep repository instructions concise and task-relevant. Follow the user's current task scope and avoid unnecessary refactoring.