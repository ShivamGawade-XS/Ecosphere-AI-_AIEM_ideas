# EcoSphere AI Accessibility Review

**Reviewed:** 2026-08-22

**Scope:** Authenticated Operations Overview, Registry, Live Data/Data Quality, Intelligence, Actions, Readiness, and responsive mobile layouts. The review combines source inspection, targeted Testing Library assertions, and desktop/mobile workspace rendering. It is a product hardening review, not a claim of independent WCAG certification.

## Review Results

| Area | Evidence | Result |
|---|---|---|
| Keyboard entry and escape | The authenticated dashboard supplies a visible-on-focus “Skip to workspace” link targeting `main#workspace-content`; its target accepts programmatic focus. `DashboardLayout.test.tsx` covers the link/target contract. | Implemented. |
| Focus visibility | Global styles apply a high-contrast `:focus-visible` outline to buttons, links, inputs, selects, textareas, and programmatic focus targets. Pointer interaction does not trigger the focus outline. | Implemented. |
| Reduced motion | Global `prefers-reduced-motion: reduce` rules shorten non-essential animation and transition time and disable smooth scrolling. | Implemented. |
| Form labelling | Operational forms use visible labels or explicit `aria-label` text for organization, site, meter, reading, import, factor, correction, scenario, action, and member-role controls. | Reviewed in source and covered in focused workspace tests. |
| Live feedback | Asynchronous success/loading feedback is exposed through `role="status"`; destructive/protected errors use `role="alert"` in Registry, Data Quality, Actions, Intelligence, Readiness, and Overview. | Implemented and regression-tested on priority routes. |
| Unknown versus empty state | The default Overview now announces protected-query failures and avoids rendering missing action/reading/monitoring data as zero or empty state. Data Quality similarly exposes factor and lineage authorization failures. | Implemented and regression-tested. |
| Tenant administration | Member control uses labelled select elements, authorization-denial copy, and server-side owner protection against sole-owner demotion. | Implemented and regression-tested. |
| Responsive review | Full-page captures at 375×812 for Registry, Readiness, Intelligence, and Actions show a single-column operational flow without hidden essential controls. | Visually reviewed. |

## Automated Evidence

| Test surface | Assertions introduced or retained |
|---|---|
| `client/src/components/DashboardLayout.test.tsx` | Sidebar navigation plus skip-link and main-target accessibility contract. |
| `client/src/pages/EcosystemWorkspaces.test.tsx` | Tenant administration labels/denial state, default Overview protected-data error state, operational loading/mutation states. |
| `client/src/pages/ImplementationDashboard.test.tsx` | Audit evidence available/denied states. |
| `client/src/pages/IngestionWorkbench.test.tsx` | Factor evidence, correction lineage, protected evidence denial, import feedback and source labels. |

## Remaining Validation Boundaries

The review did not execute a third-party automated accessibility scanner against a deployed production origin, nor a human screen-reader study across all browser/assistive-technology combinations. Before making a conformance claim, run a deployed-origin audit, test the most important flows with keyboard-only navigation and at least one screen reader, verify final contrast in the deployed theme, and record any remediations. These remaining checks do not negate the implemented accessibility controls; they limit the claims that can be made about formal conformance.
