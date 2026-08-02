# Darzi Pro — UI Redesign Roadmap

## Strategic Goal
**Maximize visual improvement while minimizing risk.**

This roadmap sequences the UI redesign from highest visual impact / lowest risk to lower impact / higher risk. The strategy is to establish a strong visual foundation globally before swapping out complex structural components or interactive patterns. No backend, state management, or business logic will be touched during this presentation-only redesign.

---

## Phase 1: Foundation (Global Identity & Typography)
**Impact:** 🔴 High | **Risk:** 🟢 Low | **Estimated Effort:** 1-2 Days

The highest impact step with near-zero risk is updating the global CSS tokens. This instantly refreshes the application's look and feel without altering any component logic or structure.

**Tasks:**
1. **Design Tokens:** Define CSS variables in `styles.css` for the new cool-neutral palette, single indigo accent, and semantic colors (Success, Warning, Danger, Info).
2. **Typography Stack:** Integrate `Inter` (sans-serif) and `JetBrains Mono` (monospace). Apply the V2 type scale to global heading and body styles.
3. **Material Overrides (Global):** Strip away default Angular Material candy colors, heavy shadows, and rounded corners globally using CSS overrides, forcing them to inherit the new tokens.

---

## Phase 2: Application Layout & Navigation
**Impact:** 🔴 High | **Risk:** 🟡 Medium | **Estimated Effort:** 3-5 Days

Shifting from a standard top-header layout to a desktop-first fixed sidebar layout drastically improves vertical space and professional density.

**Tasks:**
1. **App Shell (`DpAppShell`):** Create the main structural grid separating the sidebar from the scrollable content area.
2. **Sidebar (`DpSidebar`, `DpNavItem`, `DpUserBlock`):** Implement the expandable/collapsible sidebar with subtle tinted hover states (Linear/Notion style).
3. **Page Headers (`DpPageHeader`, `DpBreadcrumb`):** Standardize the top of every view to ensure a consistent title and action-button placement.

---

## Phase 3: Core Primitives (The "Dumb" Components)
**Impact:** 🔴 High | **Risk:** 🟡 Medium | **Estimated Effort:** 4-6 Days

Replacing default Angular Material components with custom presentational components sheds visual bloat and establishes the tailored aesthetic. 

**Tasks:**
1. **Cards (`DpCard`, `DpEmptyState`):** Implement the base surface for all content, including flush and interactive hover variants.
2. **Buttons (`DpButton`):** Implement Primary, Secondary, Ghost, Danger, and Icon variants.
3. **Badges (`DpBadge`):** Implement standard semantic status indicators.
4. **Basic Forms (`DpInput`, `DpSearch`, `DpTextarea`):** Replace `<mat-form-field>` with native inputs styled via custom classes to remove floating labels and thick outlines.

---

## Phase 4: Data Grids & Tables
**Impact:** 🔴 High | **Risk:** 🔴 High | **Estimated Effort:** 5-7 Days

Tables are the primary interaction surface in Darzi Pro. Modifying them carries higher risk due to data binding and row actions, but yields massive usability improvements.

**Tasks:**
1. **Table Structure (`DpTable`):** Implement the dense, flush-card table layout with thin borders and distinct header typography.
2. **Table Cells (`DpCustomerIdentityCell`, `DpActionsCell`):** Implement hover-visible actions and avatar treatments.
3. **Pagination (`DpPaginator`):** Create a clean, subtle paginator to replace the bulky default Material paginator.
4. **Row States:** Add visual indicators for selected, hovered, focused, and priority rows.

---

## Phase 5: Domain-Specific UI Patterns
**Impact:** 🟡 Medium | **Risk:** 🟡 Medium | **Estimated Effort:** 4-5 Days

These components are highly visible but scoped to specific workflows (like taking measurements or viewing the dashboard).

**Tasks:**
1. **Measurement System (`DpMeasurementGrid`, `DpMeasurementField`):** Implement the dense, 16px tabular-num input grid for fast, keyboard-friendly data entry.
2. **Order Specifics (`DpOrderStatusBadge`, `DpOrderPriorityIndicator`):** Apply tailored colors for the stitching/cutting pipeline states.
3. **Dashboard (`DpKpiCard`):** Create the high-impact metric cards with colored icon blocks.
4. **Payments (`DpCurrencyDisplay`):** Standardize tabular currency formatting across the app.

---

## Phase 6: Advanced Interactions & Feedback
**Impact:** 🟡 Medium | **Risk:** 🔴 High | **Estimated Effort:** 5-8 Days

These features significantly improve power-user UX but require complex event handling, keyboard navigation, and overlay management.

**Tasks:**
1. **Dialogs (`DpDialogContainer`, `DpConfirmDialog`):** Standardize modals to remove Material chrome and apply custom backdrops and animations.
2. **Context Menus (`DpContextMenu`):** Implement custom right-click menus on table rows, overriding default browser behavior.
3. **Filters (`DpFilterBar`, `DpFilterChip`):** Implement interactive toggle chips for list filtering.
4. **Command Palette (`DpCommandPalette`):** Build the `Ctrl+K` global fuzzy search and action modal. (Highest risk, save for last).

---

## Summary of Effort
* **Total Estimated Time:** 3-5 Weeks
* **Risk Mitigation Strategy:** By executing Phase 1 and 2 first, the application will immediately *look* like V2 while still falling back on V1 components for complex forms and tables. Phased rollout ensures the business logic remains untouched while the UI is swapped incrementally.
