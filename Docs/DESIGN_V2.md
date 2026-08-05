# Darzi Pro — UI/UX Design System V2

### Presentation-Only Redesign Specification

---

## Guiding Constraint

This document specifies a **presentation-only** redesign. No business logic, services, stores, repositories, Electron code, TypeORM code, or routes are modified. Only component templates (HTML), component stylesheets (CSS), and the global stylesheet (`styles.css`) are changed. Component TypeScript files are modified **only** when adding or removing Angular Material imports, template helper getters, or animation triggers — never to alter data flow, IPC calls, or state management.

---

# 1. Visual Identity

## 1.1 Design Philosophy

Darzi Pro V2 draws from three visual anchors:

| Anchor | What We Take |
|---|---|
| **Linear** | Monochrome surfaces, tight spacing, keyboard-first feel, ultralight borders, muted iconography |
| **Notion** | Content-density hierarchy, clean typography ladders, generous whitespace, understated interactivity |
| **Shopify Admin** | Structured card layouts, clear action hierarchy, professional data-density, warm neutral palette |

### What We Reject

| Anti-Pattern | Why |
|---|---|
| Default Angular Material chrome | Overly rounded, candy-colored, Google-branded feel |
| Generic ERP / Bootstrap admin | Sidebar-heavy, cramped data grids, generic blue CTA everywhere |
| Dashboard widget overload | Too many charts competing for attention on first load |

## 1.2 Brand Expression

```
Logo mark:       Scissors icon (content_cut) in a subtle gradient badge
Product name:    "Darzi Pro" — displayed as logotype, weight 600, tracking -0.03em
Product tagline: Hidden by default. Shown only on login screen.
```

The brand is expressed through **restraint** — a single accent color, monochrome icons, and typography hierarchy replace heavy branding.

## 1.3 Color Palette

The palette is **cool-neutral** with a single indigo accent. All semantic colors are desaturated compared to V1 for a calmer, more professional appearance.

### Core Colors

| Token | Hex | Usage |
|---|---|---|
| `--dp-bg` | `#F9FAFB` | Application background — the "canvas" |
| `--dp-surface` | `#FFFFFF` | Cards, panels, modals, dropdowns |
| `--dp-surface-hover` | `#F3F4F6` | Surface on hover / pressed state |
| `--dp-surface-raised` | `#FFFFFF` | Elevated cards (with shadow) |
| `--dp-border` | `#E5E7EB` | Default dividers, card borders |
| `--dp-border-subtle` | `#F3F4F6` | Table row separators, inner dividers |
| `--dp-border-focus` | `#818CF8` | Focus rings on inputs and buttons |

### Text Colors

| Token | Hex | Usage |
|---|---|---|
| `--dp-text` | `#111827` | Primary headings and body text |
| `--dp-text-secondary` | `#6B7280` | Labels, descriptions, metadata |
| `--dp-text-tertiary` | `#9CA3AF` | Timestamps, placeholders, disabled |
| `--dp-text-inverse` | `#FFFFFF` | Text on filled buttons / dark surfaces |

### Accent Colors

| Token | Hex | Usage |
|---|---|---|
| `--dp-accent` | `#6366F1` | Primary CTA, active nav, focus rings |
| `--dp-accent-hover` | `#4F46E5` | Hover on primary accent elements |
| `--dp-accent-subtle` | `#EEF2FF` | Accent tint backgrounds (badges, active rows) |
| `--dp-accent-muted` | `#C7D2FE` | Accent borders (light context) |

### Semantic Colors

| Token | Hex | Light BG | Usage |
|---|---|---|---|
| `--dp-success` | `#059669` | `#ECFDF5` | Delivered, Paid, Active |
| `--dp-warning` | `#D97706` | `#FFFBEB` | Due today, Pending |
| `--dp-danger` | `#DC2626` | `#FEF2F2` | Overdue, Error, Delete |
| `--dp-info` | `#2563EB` | `#EFF6FF` | Informational, links |

### Status-Specific Colors (Order Pipeline)

| Status | Dot/Badge BG | Text Color | Rationale |
|---|---|---|---|
| Pending | `#FEF3C7` | `#92400E` | Warm amber — waiting state |
| Cutting | `#DBEAFE` | `#1E40AF` | Cool blue — early production |
| Stitching | `#E0E7FF` | `#3730A3` | Indigo — active craftsmanship |
| Finishing | `#F3E8FF` | `#6B21A8` | Purple — nearing completion |
| Ready | `#D1FAE5` | `#065F46` | Green — actionable pickup |
| Delivered | `#F3F4F6` | `#6B7280` | Grey — completed, de-emphasized |
| Cancelled | `#FEE2E2` | `#991B1B` | Red — terminal state |

### Priority Colors

| Priority | Row Left Border | Badge BG | Badge Text |
|---|---|---|---|
| Normal | none | none | none |
| High | 3px solid `#EA580C` | `#FFF7ED` | `#C2410C` |
| Urgent | 3px solid `#DC2626` | `#FEF2F2` | `#991B1B` |

---

# 2. Typography

## 2.1 Font Stack

```css
--dp-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--dp-font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
```

Inter is loaded at weights **400, 500, 600, 700**. No other weights are used.

## 2.2 Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `--dp-text-page-title` | 24px | 700 | 32px | -0.025em | Page headings: "Dashboard", "Customers" |
| `--dp-text-section-title` | 16px | 600 | 24px | -0.01em | Card titles, section headers |
| `--dp-text-body` | 14px | 400 | 20px | 0 | Default body, table cells, descriptions |
| `--dp-text-body-medium` | 14px | 500 | 20px | 0 | Emphasized body text, nav items |
| `--dp-text-label` | 13px | 500 | 18px | 0 | Form labels, column headers |
| `--dp-text-caption` | 13px | 500 | 18px | 0.01em | Metadata, timestamps, badge text |
| `--dp-text-overline` | 11px | 600 | 16px | 0.06em | Section overlines, uppercase labels |
| `--dp-text-kpi` | 28px | 700 | 34px | -0.02em | KPI large numbers |
| `--dp-text-kpi-sm` | 20px | 700 | 26px | -0.01em | KPI currency values |

> **Note:** `--dp-text-caption` is set at 13px (not 12px). The application runs on small laptop screens (15–17") in tailor shops with imperfect lighting. 12px is reserved only for decorative metadata (keyboard shortcut badges, scrollbar labels).

---

# 3. Layout System

## 3.1 Application Shell

The app uses a **fixed sidebar + scrollable content** layout. The header is removed from V1's design. Navigation, branding, and user controls all consolidate into the sidebar.

```text
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌──────────┐  ┌──────────────────────────────────────┐  │
│  │          │  │                                      │  │
│  │ Sidebar  │  │         Content Area                 │  │
│  │  240px   │  │         (scrollable)                 │  │
│  │          │  │                                      │  │
│  │          │  │                                      │  │
│  │          │  │                                      │  │
│  │          │  │                                      │  │
│  └──────────┘  └──────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Why No Top Header

Linear, Notion, and modern desktop apps embed identity and user controls inside the sidebar. This yields:
- **More vertical space** for content (no 64px header eating into the viewport).
- **Cleaner hierarchy** — the eye flows left-to-right: navigation → content.
- **Reduced visual noise** — one chrome region instead of two.

## 3.2 Shell Component Structure

```html
<div class="shell">
  <aside class="shell__sidebar">
    <!-- Brand + Navigation + User -->
  </aside>
  <main class="shell__content">
    <ng-content></ng-content>
  </main>
</div>
```

### Sidebar Specifications

| Property | Value |
|---|---|
| Width | 240px (expanded), 56px (collapsed) |
| Background | `--dp-surface` (#FFFFFF) |
| Right border | 1px solid `--dp-border` |
| Padding | 16px 12px |
| Scroll | Independent overflow-y: auto |

### Content Area Specifications

| Property | Value |
|---|---|
| Background | `--dp-bg` (#F9FAFB) |
| Padding | 32px |
| Max width | 1200px (centered with `margin: 0 auto`) |
| Overflow | `overflow-y: auto` (the only scrollable region) |

## 3.3 Page Layout Pattern

Every content page follows a consistent vertical stack:

```text
┌──────────────────────────────────────────┐
│  Breadcrumb (detail pages only)          │
├──────────────────────────────────────────┤
│  Page Header                             │
│  [Title]                    [Actions]    │
├──────────────────────────────────────────┤
│  Toolbar / Filters (optional)            │
├──────────────────────────────────────────┤
│                                          │
│  Primary Content                         │
│  (Table / Cards / Form / Detail)         │
│                                          │
└──────────────────────────────────────────┘
```

### Page Header

```css
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--dp-text);
  letter-spacing: -0.025em;
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
  color: var(--dp-text-tertiary);
  margin-top: 2px;
}
```

## 3.4 Breadcrumb System

Detail pages (Customer Detail, Order Detail, Payment Detail) display a breadcrumb above the page header.

```text
← Orders  ›  ORD-001
```

```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.breadcrumb__back {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dp-text-secondary);
  cursor: pointer;
  transition: all var(--dp-transition-normal);
}

.breadcrumb__back:hover {
  background: var(--dp-surface-hover);
  color: var(--dp-text);
}

.breadcrumb__back mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
}

.breadcrumb__link {
  font-size: 13px;
  font-weight: 500;
  color: var(--dp-text-secondary);
  cursor: pointer;
  text-decoration: none;
  transition: color var(--dp-transition-normal);
}

.breadcrumb__link:hover {
  color: var(--dp-text);
}

.breadcrumb__separator {
  font-size: 14px;
  color: var(--dp-text-tertiary);
}

.breadcrumb__current {
  font-size: 13px;
  font-weight: 500;
  color: var(--dp-text);
}
```

---

# 4. Navigation System

## 4.1 Sidebar Anatomy

The sidebar is divided into five vertical zones:

```text
┌─────────────────────┐
│  Brand Block         │  ← Logo + "Darzi Pro"
│                      │
├─────────────────────┤
│  Primary Nav         │  ← Dashboard, Customers, Orders, Payments
│                      │
├─────────────────────┤
│  Secondary Nav       │  ← Reports, Settings (role-gated)
│                      │
├─────────────────────┤
│  Collapse Toggle     │  ← Collapse / expand sidebar
├─────────────────────┤
│  User Block          │  ← Avatar + name + logout
└─────────────────────┘
```

## 4.2 Brand Block

```text
┌─────────────────────┐
│  [✂]  Darzi Pro      │
└─────────────────────┘
```

| Element | Spec |
|---|---|
| Logo container | 32×32px, border-radius: 8px, background: `--dp-accent`, centered scissors icon in white (18px) |
| Product name | 16px, weight 600, tracking -0.03em, `--dp-text` |
| Gap | 10px between logo and name |
| Bottom margin | 24px below brand block |
| Collapsed state | Logo only, centered |

## 4.3 Navigation Items

Each nav item is a horizontal row with icon + label.

### Default State

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--dp-text-secondary);
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
  margin-bottom: 2px;
}

.nav-item mat-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
  color: var(--dp-text-tertiary);
  transition: color 0.15s ease;
}
```

### Hover State

```css
.nav-item:hover {
  background: var(--dp-surface-hover);
  color: var(--dp-text);
}

.nav-item:hover mat-icon {
  color: var(--dp-text-secondary);
}
```

### Active State (Linear-Inspired)

Instead of filling the entire item with accent color (V1), we use a **subtle tinted background**:

```css
.nav-item.active {
  background: var(--dp-accent-subtle);
  color: var(--dp-accent);
  font-weight: 600;
}

.nav-item.active mat-icon {
  color: var(--dp-accent);
}
```

> **Rationale:** A filled accent background (V1: `background-color: var(--primary-color); color: #ffffff`) makes the sidebar feel heavy and draws too much attention away from content. The subtle tint approach used by Linear and Notion keeps the active state visible without overwhelming.

## 4.4 Section Dividers

Between Primary Nav and Secondary Nav, insert a thin horizontal rule:

```css
.nav-divider {
  height: 1px;
  background: var(--dp-border);
  margin: 12px 0;
}
```

## 4.5 User Block

Positioned at the sidebar bottom with `margin-top: auto`:

```text
┌─────────────────────────┐
│  [A]  Ahmad Khan         │
│       Owner  ·  Logout   │
└─────────────────────────┘
```

| Element | Spec |
|---|---|
| Avatar | 32×32px circle, `--dp-accent-subtle` background, `--dp-accent` text, weight 600, 13px font |
| Name | 14px, weight 500, `--dp-text` |
| Role | 13px, weight 500, `--dp-text-tertiary`, lowercase |
| Logout | 13px, weight 500, `--dp-danger` on hover, acts as a text button |
| Container | padding: 12px, border-top: 1px solid `--dp-border`, margin-top: auto |
| Collapsed state | Avatar only, centered, tooltip shows name |

## 4.6 Sidebar Collapse

The sidebar can collapse to icon-only width for more horizontal content space.

| Property | Expanded | Collapsed |
|---|---|---|
| Width | 240px | 56px |
| Nav labels | Visible | Hidden (tooltip on hover) |
| Brand text | Visible | Hidden |
| User name/role | Visible | Hidden |
| Toggle shortcut | `Ctrl+B` | `Ctrl+B` |

### Collapse Toggle Button

Positioned between secondary nav and user block:

```css
.sidebar-collapse-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--dp-text-tertiary);
  cursor: pointer;
  transition: color var(--dp-transition-normal);
  margin: 8px 0;
}

.sidebar-collapse-toggle:hover {
  color: var(--dp-text-secondary);
}
```

Icon: `chevron_left` when expanded, `chevron_right` when collapsed.

### Collapsed Nav Item

```css
.shell--collapsed .nav-item {
  justify-content: center;
  padding: 8px;
}

.shell--collapsed .nav-item span {
  display: none;
}
```

---

# 5. Card System

## 5.1 Base Card

Cards are the primary content container throughout the application.

```css
.dp-card {
  background: var(--dp-surface);
  border: 1px solid var(--dp-border);
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
```

### Card Variants

| Variant | Modifier | Behavior |
|---|---|---|
| Default | `.dp-card` | Static container with border |
| Interactive | `.dp-card--interactive` | Hover lifts with subtle shadow; cursor: pointer |
| Flush | `.dp-card--flush` | No padding — used when card contains full-bleed table |
| Outlined | `.dp-card` (default) | 1px border, no shadow |
| Raised | `.dp-card--raised` | Box-shadow instead of border |

### Interactive Card Hover

```css
.dp-card--interactive:hover {
  border-color: var(--dp-accent-muted);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 4px 12px 0 rgba(0, 0, 0, 0.03);
}
```

## 5.2 Card Anatomy

```text
┌──────────────────────────────────────────┐
│  Card Header (optional)                  │
│  [Title]                    [Actions]    │
├──────────────────────────────────────────┤
│                                          │
│  Card Body                               │
│                                          │
├──────────────────────────────────────────┤
│  Card Footer (optional)                  │
└──────────────────────────────────────────┘
```

```css
.dp-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--dp-border-subtle);
}

.dp-card__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--dp-text);
  letter-spacing: -0.01em;
}

.dp-card__body {
  padding: 20px;
}

.dp-card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 20px;
  border-top: 1px solid var(--dp-border-subtle);
  gap: 8px;
}
```

## 5.3 KPI Card (Dashboard Metrics)

KPI cards are **compact, information-dense** cards showing a single metric.

```text
┌───────────────────────────────┐
│  [Icon]                       │
│                               │
│  1,247                        │  ← Large number
│  Total Customers              │  ← Label
│  +12 this month               │  ← Secondary context (optional)
└───────────────────────────────┘
```

```css
.kpi-card {
  background: var(--dp-surface);
  border: 1px solid var(--dp-border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.kpi-card:hover {
  border-color: var(--dp-accent-muted);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.kpi-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-card__icon mat-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
}

.kpi-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--dp-text);
  line-height: 1;
  letter-spacing: -0.02em;
}

.kpi-card__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--dp-text-secondary);
  margin-top: 2px;
}

.kpi-card__context {
  font-size: 13px;
  color: var(--dp-text-tertiary);
}
```

### KPI Icon Tint Backgrounds

```css
.kpi-icon--blue    { background: #EFF6FF; }
.kpi-icon--blue mat-icon { color: #3B82F6; }

.kpi-icon--indigo  { background: #EEF2FF; }
.kpi-icon--indigo mat-icon { color: #6366F1; }

.kpi-icon--amber   { background: #FFFBEB; }
.kpi-icon--amber mat-icon { color: #D97706; }

.kpi-icon--red     { background: #FEF2F2; }
.kpi-icon--red mat-icon { color: #DC2626; }

.kpi-icon--green   { background: #ECFDF5; }
.kpi-icon--green mat-icon { color: #059669; }

.kpi-icon--teal    { background: #F0FDFA; }
.kpi-icon--teal mat-icon { color: #0D9488; }
```

## 5.4 Dialog / Modal

Dialogs are used for confirmations (delete, cancel), payment entry, and quick forms. They must shed the default Material dialog chrome.

### Anatomy

```text
┌──────────────────────────────────────┐
│                                      │
│  Dialog Title                        │
│  Optional description text           │
│                                      │
│  [Content area / form]               │
│                                      │
│               [Cancel]  [Confirm]    │
│                                      │
└──────────────────────────────────────┘
```

### Specifications

| Property | Value |
|---|---|
| Max width | 480px (forms: 560px) |
| Border radius | `--dp-radius-lg` (12px) |
| Padding | 24px |
| Title | 18px, weight 600, `--dp-text` |
| Description | 14px, weight 400, `--dp-text-secondary`, margin-top: 4px |
| Content area | margin-top: 20px |
| Footer | margin-top: 24px, flex, justify-content: flex-end, gap: 8px |
| Backdrop | `rgba(0, 0, 0, 0.4)` |
| Entrance | scale(0.98)→1.0 + opacity 0→1, 200ms ease-out |

### Danger Confirmation Dialog

For delete and cancel actions, the confirm button uses `.dp-btn--danger`:

```text
┌──────────────────────────────────────┐
│                                      │
│  Delete Customer                     │
│  This will permanently remove        │
│  "Ahmad Khan" and all their          │
│  measurements. This cannot           │
│  be undone.                          │
│                                      │
│               [Cancel]  [Delete]     │
│                                      │
└──────────────────────────────────────┘
```

```css
.dp-dialog {
  padding: 24px;
}

.dp-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--dp-text);
  margin: 0;
}

.dp-dialog__description {
  font-size: 14px;
  color: var(--dp-text-secondary);
  margin: 4px 0 0;
  line-height: 1.5;
}

.dp-dialog__content {
  margin-top: 20px;
}

.dp-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
```

---

# 6. Table System

## 6.1 Design Goals

Tables are the **primary interaction surface** in Darzi Pro. They must be:

1. **Scannable** — clear column alignment, tight row height, readable typography
2. **Interactive** — clickable rows, visible hover states, inline actions
3. **Clean** — no heavy zebra striping, no Material default cell padding bloat

## 6.2 Table Container

Tables are always wrapped in a flush card (`.dp-card--flush`):

```text
┌──────────────────────────────────────────────┐
│  Card Header: "Customers"         [Actions]  │
├──────────────────────────────────────────────┤
│  Code   Name           Phone       Added On  │  ← Column Headers
│─────────────────────────────────────────────│
│  C-001  Ahmad Khan     0300...     12 Jun    │  ← Row
│  C-002  Bilal Sharif   0321...     15 Jun    │
│  ...                                         │
├──────────────────────────────────────────────┤
│  Showing 1–20 of 1,247            < 1 2 3 > │  ← Pagination
└──────────────────────────────────────────────┘
```

## 6.3 Table Styling

### Column Headers

```css
.dp-table th.mat-header-cell {
  font-size: 12px;
  font-weight: 600;
  color: var(--dp-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--dp-border);
  padding: 10px 16px;
  background: var(--dp-bg);
}
```

### Table Rows

```css
.dp-table tr.mat-row {
  height: 52px;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.dp-table tr.mat-row:hover {
  background-color: var(--dp-surface-hover);
}

.dp-table tr.mat-row:focus-visible {
  outline: 2px solid var(--dp-accent-subtle);
  outline-offset: -2px;
}

.dp-table td.mat-cell {
  font-size: 14px;
  color: var(--dp-text);
  padding: 0 16px;
  border-bottom: 1px solid var(--dp-border-subtle);
}

.dp-table tr.mat-row:last-child td.mat-cell {
  border-bottom: none;
}
```

### Priority Row Treatment

High-priority orders get a scannable left-edge border:

```css
.row--priority-high {
  border-left: 3px solid #EA580C;
}

.row--priority-urgent {
  border-left: 3px solid var(--dp-danger);
}

.row--overdue {
  background: linear-gradient(90deg, #FEF2F2 0%, var(--dp-surface) 4%);
}
```

## 6.4 Cell-Level Patterns

### Name + Avatar Cell

```css
.cell-identity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cell-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--dp-accent-subtle);
  color: var(--dp-accent);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cell-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--dp-text);
}
```

### Monospace Cell (Order Numbers, Codes, Phone Numbers)

```css
.cell-mono {
  font-family: var(--dp-font-mono);
  font-size: 13px;
  color: var(--dp-text-secondary);
}
```

### Status Badge Cell

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}
```

### Currency Cell

All currency values use Angular's `number` pipe. "Rs" prefix has a 4px gap. Values never wrap.

```css
.cell-currency {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--dp-text);
  white-space: nowrap;
}

.cell-currency--due {
  color: var(--dp-warning);
}

.cell-currency--clear {
  color: var(--dp-success);
}

.cell-currency__prefix {
  color: var(--dp-text-tertiary);
  margin-right: 4px;
  font-weight: 400;
}
```

### Date Cell

```css
.cell-date {
  font-size: 13px;
  color: var(--dp-text-secondary);
}
```

### Actions Cell

Actions appear on hover **and** on keyboard focus. Default state is faintly visible:

```css
.actions-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.4;
  transition: opacity 0.15s ease;
}

tr.mat-row:hover .actions-cell,
tr.mat-row:focus-within .actions-cell {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: var(--dp-text-tertiary);
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--dp-surface-hover);
  color: var(--dp-text);
}

.action-btn--danger:hover {
  background: var(--dp-danger-subtle);
  color: var(--dp-danger);
}
```

## 6.5 Pagination

```css
.dp-paginator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--dp-border);
  font-size: 13px;
  color: var(--dp-text-secondary);
}
```

## 6.6 Empty State

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
}

.empty-state__icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--dp-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-state__icon mat-icon {
  font-size: 28px;
  color: var(--dp-text-tertiary);
}

.empty-state__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--dp-text);
  margin: 0 0 4px;
}

.empty-state__description {
  font-size: 14px;
  color: var(--dp-text-secondary);
  margin: 0 0 20px;
  max-width: 320px;
}
```

## 6.7 Row Context Menu

Desktop users expect right-click context menus on table rows. Right-clicking a row opens a custom context menu.

### Menu Content (varies by module)

**Orders:** View Details, Edit, Change Status ›, Print Receipt, Delete
**Customers:** View Profile, Edit, Delete
**Payments:** View Details, Print Receipt

### Styling

```css
.context-menu {
  position: fixed;
  z-index: var(--dp-z-dropdown);
  min-width: 180px;
  background: var(--dp-surface);
  border: 1px solid var(--dp-border);
  border-radius: var(--dp-radius-md);
  box-shadow: var(--dp-shadow-md);
  padding: 4px;
  animation: context-menu-in 0.1s ease-out;
}

@keyframes context-menu-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.context-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--dp-radius-sm);
  font-size: 13px;
  font-weight: 500;
  color: var(--dp-text);
  cursor: pointer;
  transition: background var(--dp-transition-fast);
}

.context-menu__item:hover {
  background: var(--dp-surface-hover);
}

.context-menu__item--danger {
  color: var(--dp-danger);
}

.context-menu__item--danger:hover {
  background: var(--dp-danger-subtle);
}

.context-menu__divider {
  height: 1px;
  background: var(--dp-border-subtle);
  margin: 4px 0;
}
```

---

# 7. Form System

## 7.1 Design Goals

Forms should feel **lightweight and fast**. Avoid the bulky Material `appearance="outline"` with floating labels.

> **Critical Rule:** Do NOT use `<mat-form-field>` for standard text inputs, textareas, or search bars. Use native `<input class="dp-input">` with `<label class="dp-field__label">`. Reserve `mat-form-field` ONLY for `<mat-select>` and `<mat-autocomplete>` where Material's dropdown overlay is genuinely needed — and even then, apply V2 overrides from §18.

## 7.2 Form Layout

Forms use a two-column grid for desktop:

```css
.dp-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 24px;
}

.dp-form-grid--single {
  grid-template-columns: 1fr;
}

.dp-form-field--full {
  grid-column: 1 / -1;
}
```

## 7.3 Field Structure

```text
Label *
┌──────────────────────────────────┐
│  Placeholder text                │
└──────────────────────────────────┘
Helper text or error
```

### Label

```css
.dp-field__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--dp-text);
  margin-bottom: 6px;
  display: block;
}

.dp-field__required {
  color: var(--dp-danger);
  margin-left: 2px;
}
```

### Input

```css
.dp-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
  font-family: var(--dp-font-sans);
  color: var(--dp-text);
  background: var(--dp-surface);
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dp-input::placeholder {
  color: var(--dp-text-tertiary);
}

.dp-input:hover {
  border-color: #D1D5DB;
}

.dp-input:focus {
  border-color: var(--dp-accent);
  box-shadow: 0 0 0 3px var(--dp-accent-subtle);
}

.dp-input--error {
  border-color: var(--dp-danger);
}

.dp-input--error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}
```

### Textarea

```css
.dp-textarea {
  height: auto;
  min-height: 80px;
  padding: 10px 12px;
  resize: vertical;
}
```

### Helper / Error Text

```css
.dp-field__helper {
  font-size: 13px;
  color: var(--dp-text-tertiary);
  margin-top: 4px;
}

.dp-field__error {
  font-size: 13px;
  color: var(--dp-danger);
  margin-top: 4px;
}
```

## 7.4 Form Sections

Large forms are broken into visually distinct sections:

```css
.dp-form-section {
  margin-bottom: 32px;
}

.dp-form-section__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--dp-text);
  margin: 0 0 4px;
}

.dp-form-section__description {
  font-size: 13px;
  color: var(--dp-text-secondary);
  margin: 0 0 20px;
}

.dp-form-section__divider {
  height: 1px;
  background: var(--dp-border);
  margin: 32px 0;
}
```

## 7.5 Measurement Input Pattern

Measurements are the **core domain activity** — a tailor records 6–12 numeric values per garment. This demands a specialized input pattern, not the generic form grid.

### Layout

Measurements use a **compact 3-column or 4-column grid** of small labeled numeric fields:

```text
┌──────────────────────────────────────────────────┐
│  Shirt Measurements         [Copy from Previous] │
├──────────────────────────────────────────────────┤
│                                                  │
│  Neck          Chest         Waist               │
│  ┌────── in┐   ┌────── in┐   ┌────── in┐        │
│  │  16.5   │   │  40     │   │  34     │        │
│  └─────────┘   └─────────┘   └─────────┘        │
│                                                  │
│  Shoulder      Sleeve        Length               │
│  ┌────── in┐   ┌────── in┐   ┌────── in┐        │
│  │  18     │   │  24     │   │  28     │        │
│  └─────────┘   └─────────┘   └─────────┘        │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Measurement Grid

```css
.measurement-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* 4-column variant for wider garment types */
.measurement-grid--4col {
  grid-template-columns: repeat(4, 1fr);
}
```

### Measurement Field

```css
.measurement-field {
  display: flex;
  flex-direction: column;
}

.measurement-field__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--dp-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 4px;
}

.measurement-field__input-wrap {
  display: flex;
  align-items: center;
  position: relative;
}

.measurement-field__input {
  width: 100%;
  height: 44px;
  padding: 0 36px 0 12px;
  font-size: 16px;
  font-weight: 600;
  font-family: var(--dp-font-sans);
  font-variant-numeric: tabular-nums;
  color: var(--dp-text);
  background: var(--dp-surface);
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  outline: none;
  text-align: left;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.measurement-field__input:focus {
  border-color: var(--dp-accent);
  box-shadow: 0 0 0 3px var(--dp-accent-subtle);
}

.measurement-field__unit {
  position: absolute;
  right: 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--dp-text-tertiary);
  pointer-events: none;
}
```

> **Key Design Decisions:**
> - **16px font** (larger than standard 14px) for numeric values — readability from arm's length
> - **44px height** (taller than standard 40px) — easier to tap when holding a tape measure
> - **Unit suffix inline** — "in" is always visible, no ambiguity
> - **Tab-to-next-field** — natural keyboard flow through all fields
> - **3-column layout** — balances density with readability

### Copy From Previous

The "Copy from Previous" button sits in the measurement section header and pre-fills all fields from the customer's last recorded measurement of the same garment type.

```css
.measurement-copy-btn {
  font-size: 13px;
  font-weight: 500;
  color: var(--dp-accent);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.measurement-copy-btn:hover {
  text-decoration: underline;
}
```

### Measurement Notes

Below the numeric grid, expandable text areas for fabric instructions, stitching instructions, and special requests:

```css
.measurement-notes {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

---

# 8. Button System

## 8.1 Button Variants

| Variant | Class | Usage |
|---|---|---|
| Primary | `.dp-btn--primary` | Main CTA on each page (one per view) |
| Secondary | `.dp-btn--secondary` | Supporting actions (Cancel, Clear filters) |
| Ghost | `.dp-btn--ghost` | Low-emphasis inline actions |
| Danger | `.dp-btn--danger` | Destructive actions (Delete) |
| Icon-only | `.dp-btn--icon` | Toolbar and table row actions |

### Base Button

```css
.dp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--dp-font-sans);
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.dp-btn mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
}
```

### Primary

```css
.dp-btn--primary {
  background: var(--dp-accent);
  color: var(--dp-text-inverse);
}

.dp-btn--primary:hover {
  background: var(--dp-accent-hover);
}
```

### Secondary

```css
.dp-btn--secondary {
  background: var(--dp-surface);
  color: var(--dp-text);
  border: 1px solid var(--dp-border);
}

.dp-btn--secondary:hover {
  background: var(--dp-surface-hover);
  border-color: #D1D5DB;
}
```

### Ghost

```css
.dp-btn--ghost {
  background: transparent;
  color: var(--dp-text-secondary);
}

.dp-btn--ghost:hover {
  background: var(--dp-surface-hover);
  color: var(--dp-text);
}
```

### Danger

```css
.dp-btn--danger {
  background: transparent;
  color: var(--dp-danger);
  border: 1px solid var(--dp-border);
}

.dp-btn--danger:hover {
  background: #FEF2F2;
  border-color: #FECACA;
}
```

---

# 9. Search & Filters

## 9.1 Search Bar

The search bar uses a custom container — NOT `<mat-form-field>`:

```css
.dp-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  background: var(--dp-surface);
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dp-search:focus-within {
  border-color: var(--dp-accent);
  box-shadow: 0 0 0 3px var(--dp-accent-subtle);
}

.dp-search__icon {
  color: var(--dp-text-tertiary);
  font-size: 18px;
  flex-shrink: 0;
}

.dp-search__input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--dp-text);
  background: transparent;
  font-family: var(--dp-font-sans);
}

.dp-search__kbd {
  font-size: 11px;
  font-family: var(--dp-font-mono);
  color: var(--dp-text-tertiary);
  background: var(--dp-bg);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--dp-border);
}
```

## 9.2 Filter Bar

```css
.dp-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.dp-filter-chip {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--dp-border);
  border-radius: 6px;
  background: var(--dp-surface);
  color: var(--dp-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dp-filter-chip:hover {
  border-color: #D1D5DB;
  color: var(--dp-text);
}

.dp-filter-chip--active {
  background: var(--dp-accent-subtle);
  color: var(--dp-accent);
  border-color: var(--dp-accent-muted);
}
```

## 9.3 Command Palette

Triggered by `Ctrl+K` (or `⌘K` on macOS). A floating modal providing fuzzy search across all entities and actions — the single most differentiating desktop UX pattern.

### Anatomy

```text
┌────────────────────────────────────────────────────┐
│  🔍  Search customers, orders, actions...          │
├────────────────────────────────────────────────────┤
│                                                    │
│  CUSTOMERS                                         │
│  → Ahmad Khan · 0300-1234567                       │
│    Bilal Sharif · 0321-9876543                     │
│                                                    │
│  ORDERS                                            │
│  → ORD-001 · Ahmad Khan · Stitching               │
│    ORD-002 · Bilal · Ready                         │
│                                                    │
│  ACTIONS                                           │
│  → New Order                                       │
│    Receive Payment                                 │
│    Kanban Board                                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Specifications

| Property | Value |
|---|---|
| Trigger | `Ctrl+K` / `⌘K` |
| Dismiss | `Escape`, click backdrop, or selecting a result |
| Max width | 560px |
| Position | Centered horizontally, 20% from top |
| Backdrop | `rgba(0, 0, 0, 0.4)` |
| Entrance | scale(0.98)→1.0 + opacity, 150ms ease-out |
| Border radius | `--dp-radius-lg` (12px) |
| Shadow | `--dp-shadow-lg` |

### Search Input

```css
.command-palette__input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--dp-border);
}

.command-palette__input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 400;
  color: var(--dp-text);
  background: transparent;
  font-family: var(--dp-font-sans);
}

.command-palette__input::placeholder {
  color: var(--dp-text-tertiary);
}
```

### Results

```css
.command-palette__results {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.command-palette__group-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--dp-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 8px 8px 4px;
}

.command-palette__result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--dp-radius-sm);
  cursor: pointer;
  transition: background var(--dp-transition-fast);
}

.command-palette__result:hover,
.command-palette__result--active {
  background: var(--dp-surface-hover);
}

.command-palette__result-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--dp-text);
}

.command-palette__result-meta {
  font-size: 13px;
  color: var(--dp-text-tertiary);
  margin-left: auto;
}
```

### Keyboard Navigation

- **Arrow Up/Down:** Navigate between results
- **Enter:** Select highlighted result
- **Escape:** Dismiss palette

---

# 10. Dashboard Redesign

## 10.1 Layout

```text
┌──────────────────────────────────────────────┐
│  Overview                       Sat, Aug 2   │
│  Welcome back, Ahmad Khan                    │
├──────────────────────────────────────────────┤
│  ⚠ 3 orders are overdue  [View Overdue →]   │  ← Alert (conditional)
├──────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │  ← Order KPIs
│  └──────┘ └──────┘ └──────┘ └──────┘        │
│  ┌──────┐ ┌──────┐ ┌──────┐                 │  ← Revenue KPIs
│  └──────┘ └──────┘ └──────┘                 │
│  ┌───────────────────────┐ ┌──────────────┐  │
│  │  Quick Actions        │ │ Recent       │  │
│  └───────────────────────┘ │ Payments     │  │
│                            └──────────────┘  │
└──────────────────────────────────────────────┘
```

## 10.2 Overdue Alert Banner

Displayed **only** when overdue orders exist:

```css
.alert-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 10px;
  margin-bottom: 20px;
}

.alert-banner__icon {
  color: var(--dp-danger);
  font-size: 20px;
  flex-shrink: 0;
}

.alert-banner__text {
  font-size: 14px;
  font-weight: 500;
  color: #991B1B;
  flex: 1;
}

.alert-banner__action {
  font-size: 13px;
  font-weight: 600;
  color: #991B1B;
  cursor: pointer;
  white-space: nowrap;
}
```

## 10.3 KPI Cards Grid

**Row 1: Orders at a Glance** — `grid-template-columns: repeat(4, 1fr)`

| KPI | Icon | Icon Tint | Value Source |
|---|---|---|---|
| Total Orders | `receipt_long` | Blue | `orderStats().totalOrders` |
| Active Orders | `pending_actions` | Indigo | `orderStats().activeOrders` |
| Due Today | `today` | Amber | `orderStats().dueToday` |
| Overdue | `warning_amber` | Red | `orderStats().overdue` |

Overdue card when count > 0: left border 3px solid `--dp-danger`, subtle red gradient background.

**Row 2: Revenue & Collections** — `grid-template-columns: repeat(3, 1fr)`

| KPI | Icon | Icon Tint | Value Source |
|---|---|---|---|
| Today's Collections | `account_balance` | Green | `paymentStats().todayCollections` |
| Monthly Revenue | `show_chart` | Teal | `paymentStats().monthlyRevenue` |
| Outstanding | `account_balance_wallet` | Amber | `paymentStats().outstandingAmount` |

## 10.4 Quick Actions + Recent Payments

Below KPIs, two-column layout (2fr / 1fr):

**Left: Quick Actions** — Card with button grid:

```text
[+ New Order]  [Receive Payment]  [Kanban Board]  [Customers]
```

**Right: Recent Payments** — Compact list card showing last 5 payments. Each row: avatar + name + order number, right-aligned amount + date. Clickable rows.

---

# 11. Customer Module Redesign

## 11.1 Customer List Page

### Page Header

```text
Customers                                    [+ Add Customer]
1,247 total customers
```

### Toolbar

Search bar only — no additional filters (simplicity).

### Table (`.dp-card--flush`)

| Column | Cell Style | Width |
|---|---|---|
| Code | `.cell-mono` | 100px |
| Name | `.cell-identity` (avatar + name) | 1fr |
| Phone | `.cell-mono` | 160px |
| Address | Truncated, `--dp-text-secondary` | 1fr |
| Added On | `.cell-date` | 120px |
| Actions | Edit + Delete (hover-visible) | 80px |

Row click navigates to customer detail.

## 11.2 Customer Detail Page

**Layout: Left profile card (280px) + Right tabbed content**

```text
┌─────────────────────────────────────────────────┐
│  ← Customers  ›  Ahmad Khan                    │  ← Breadcrumb
├───────────────┬─────────────────────────────────┤
│   [AK]        │  [Overview] [Measurements]      │
│   Ahmad Khan  │  [Orders]   [Payments]          │
│   0300-1234   │                                 │
│   Gulberg     │  Tab Content Area               │
│               │                                 │
│   [Edit]      │                                 │
│   [Delete]    │                                 │
└───────────────┴─────────────────────────────────┘
```

### Profile Card

```css
.profile-card__avatar {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--dp-accent-subtle);
  color: var(--dp-accent);
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
```

## 11.3 Customer Form (Add / Edit)

Uses the form system from §7. Wrapped in a card, max-width 640px, centered.

```text
┌──────────────────────────────────────────┐
│  Add Customer                            │
├──────────────────────────────────────────┤
│  Full Name *          Phone Number *     │
│  [                ]   [                ] │
│  Address                                 │
│  [                                     ] │
│  Notes                                   │
│  [                                     ] │
├──────────────────────────────────────────┤
│                     [Cancel]  [Save]     │
└──────────────────────────────────────────┘
```

---

# 12. Order Module Redesign

## 12.1 Order List Page

### Page Header

```text
Orders                    [Kanban View]  [+ New Order]
128 orders
```

### Toolbar

```text
┌──────────────────────┐  [Status ▾]  [Garment ▾]  [Priority ▾]  [✕ Clear]
│  🔍 Search orders... │
└──────────────────────┘
```

### Table

| Column | Cell Style | Width |
|---|---|---|
| Order # | `.cell-mono` + overdue/today dots | 120px |
| Customer | Name + phone subline | 1fr |
| Garment | Garment type chip | 120px |
| Qty | Center-aligned | 60px |
| Status | Status badge (pill) | 120px |
| Delivery | Date + color coding | 120px |
| Balance | Currency, colored | 120px |
| Actions | View + Edit + Delete | 100px |

High-priority rows get a left border accent (§6.3). Overdue rows get the red gradient (§6.3).

## 12.2 Order Kanban View

### Layout

Horizontally scrolling columns organized by status:

```text
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Pending  │ │ Cutting  │ │Stitching │ │Finishing │ │  Ready   │
│ (12)     │ │ (5)      │ │ (8)      │ │ (3)      │ │ (4)      │
├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤
│ [Card]   │ │ [Card]   │ │ [Card]   │ │ [Card]   │ │ [Card]   │
│ [Card]   │ │ [Card]   │ │          │ │          │ │ [Card]   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Kanban Column & Card CSS

```css
.kanban-column {
  min-width: 260px;
  max-width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kanban-column__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
}

.kanban-column__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dp-text);
}

.kanban-column__count {
  font-size: 12px;
  font-weight: 600;
  color: var(--dp-text-tertiary);
  background: var(--dp-bg);
  padding: 2px 8px;
  border-radius: 100px;
}

.kanban-card {
  background: var(--dp-surface);
  border: 1px solid var(--dp-border);
  border-radius: 10px;
  padding: 14px;
  cursor: grab;
  transition: all 0.15s ease;
}

.kanban-card:hover {
  border-color: var(--dp-accent-muted);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
```

### Drag-and-Drop

Cards are draggable between columns using Angular CDK `DragDrop`. This calls the existing `order:updateStatus` IPC — no new service logic is needed.

| Visual State | Style |
|---|---|
| Dragging card | `--dp-shadow-lg`, slight rotation (1deg), opacity: 0.9 |
| Drop placeholder | Dashed border (2px dashed `--dp-accent-muted`), `--dp-accent-subtle` background, rounded corners |
| Drop target column | Column background tints to `--dp-accent-subtle` |

```css
.kanban-card.cdk-drag-preview {
  box-shadow: var(--dp-shadow-lg);
  transform: rotate(1deg);
  opacity: 0.9;
}

.kanban-card.cdk-drag-placeholder {
  border: 2px dashed var(--dp-accent-muted);
  background: var(--dp-accent-subtle);
  opacity: 0.5;
}
```

## 12.3 Order Detail Page

**Layout: Breadcrumb → Header → Status Timeline → Info Grid → Payment History**

### Status Timeline

```css
.timeline {
  display: flex;
  align-items: center;
  padding: 24px 0;
}

.timeline__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--dp-border);
  flex-shrink: 0;
}

.timeline__dot--completed { background: var(--dp-success); }

.timeline__dot--current {
  background: var(--dp-accent);
  box-shadow: 0 0 0 4px var(--dp-accent-subtle);
}

.timeline__connector {
  width: 32px;
  height: 2px;
  background: var(--dp-border);
}

.timeline__connector--completed { background: var(--dp-success); }

.timeline__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--dp-text-tertiary);
}

.timeline__label--current {
  color: var(--dp-accent);
  font-weight: 600;
}
```

## 12.4 Order Wizard (New/Edit)

The wizard uses a **custom vertical stepper layout**. Do NOT use `<mat-stepper>` — it generates unmistakably Material DOM. Instead, use a signal-driven `currentStep` index controlling two `<div>` regions.

```text
┌──────────────────────────────────────────────┐
│  ← New Order                                 │
├──────────┬───────────────────────────────────┤
│          │                                   │
│  ● Step 1│  Select Customer                  │
│  ○ Step 2│  Search or create a customer      │
│  ○ Step 3│                                   │
│  ○ Step 4│  ┌──────────────────────────────┐ │
│  ○ Step 5│  │  🔍 Search customers...      │ │
│  ○ Step 6│  └──────────────────────────────┘ │
│          │                                   │
│          │                   [Next →]        │
├──────────┴───────────────────────────────────┤
└──────────────────────────────────────────────┘
```

### Stepper Sidebar

```css
.wizard-steps {
  width: 200px;
  padding: 24px 16px;
  border-right: 1px solid var(--dp-border);
  flex-shrink: 0;
}

.wizard-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--dp-text-tertiary);
}

.wizard-step--active {
  color: var(--dp-accent);
  font-weight: 600;
}

.wizard-step--completed {
  color: var(--dp-success);
}

.wizard-step__indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--dp-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.wizard-step--active .wizard-step__indicator {
  border-color: var(--dp-accent);
  background: var(--dp-accent);
  color: white;
}

.wizard-step--completed .wizard-step__indicator {
  border-color: var(--dp-success);
  background: var(--dp-success);
  color: white;
}
```

### Quick Order for Repeat Customers

When a known customer is selected in Step 1, show a **"Repeat Last Order"** option that pre-fills Steps 2–5 from their most recent order. The user jumps directly to Step 6 (Review). This reduces repeat-customer orders from 6 steps to 2 (select customer → review → submit).

In Step 3 (Measurements), prominently display a **"Use previous measurements"** button that copies the last recorded values for the selected garment type.

## 12.5 Receipt & Print Preview

### Print Button Placement

On Order Detail: secondary button with `print` icon in the header actions area.
On Payment Detail: same placement.

### Print Preview Modal

A full-screen modal showing the thermal receipt layout at actual size (80mm width preview) centered on screen.

```text
┌──────────────────────────────────────────────┐
│  Print Preview                    [✕ Close]  │
├──────────────────────────────────────────────┤
│                                              │
│              ┌─────────────┐                 │
│              │             │                 │
│              │  Darzi Pro  │                 │
│              │  ────────── │                 │
│              │  ORD-001    │                 │
│              │  Ahmad Khan │                 │
│              │  ...        │                 │
│              │             │                 │
│              └─────────────┘                 │
│                                              │
│                              [Print]         │
└──────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Preview width | 280px (representing 80mm at screen scale) |
| Preview background | `#FFFFFF`, subtle shadow |
| Surrounding area | `--dp-bg` |
| Receipt font | `--dp-font-mono`, 12px |
| Print button | `.dp-btn--primary` in the modal footer |

### Print CSS

```css
@media print {
  .shell__sidebar,
  .page-header,
  .breadcrumb {
    display: none !important;
  }

  .shell__content {
    padding: 0 !important;
    max-width: none !important;
  }
}
```

---

# 13. Payment Module Redesign

## 13.1 Payment List Page

Follows the standard table page pattern from §6. Page header: "Payments" with count.

### Table

| Column | Cell Style | Width |
|---|---|---|
| Receipt # | `.cell-mono` | 120px |
| Order # | `.cell-mono` | 120px |
| Customer | `.cell-identity` | 1fr |
| Amount | `.cell-currency` | 120px |
| Method | Badge (Cash, Bank, JazzCash, Easypaisa) | 120px |
| Date | `.cell-date` | 120px |
| Actions | View + Print | 80px |

## 13.2 Payment Form (Dialog)

Recording a payment is high-frequency and high-stakes (money). It opens as a **dialog** (not a full page) for speed.

```text
┌──────────────────────────────────────────┐
│  Receive Payment                         │
│  for ORD-001 · Ahmad Khan                │
├──────────────────────────────────────────┤
│                                          │
│  Amount *                                │
│  ┌──────────────────────────────────┐    │
│  │  Rs  5,000                       │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Payment Method                          │
│  [Cash] [Bank] [JazzCash] [Easypaisa]   │  ← Segmented buttons
│                                          │
│  Notes                                   │
│  [                                     ] │
│                                          │
├──────────────────────────────────────────┤
│                  [Cancel]  [Save]        │
└──────────────────────────────────────────┘
```

### Amount Input

```css
.payment-amount-input {
  height: 56px;
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  padding-left: 40px;
}

.payment-amount-prefix {
  position: absolute;
  left: 12px;
  font-size: 16px;
  font-weight: 500;
  color: var(--dp-text-tertiary);
}
```

### Payment Method Selector

Use **segmented buttons** (not a dropdown) — fewer clicks, visible options:

```css
.payment-method-group {
  display: flex;
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  overflow: hidden;
}

.payment-method-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  background: var(--dp-surface);
  color: var(--dp-text-secondary);
  border: none;
  border-right: 1px solid var(--dp-border);
  cursor: pointer;
  transition: all var(--dp-transition-normal);
}

.payment-method-btn:last-child {
  border-right: none;
}

.payment-method-btn:hover {
  background: var(--dp-surface-hover);
}

.payment-method-btn--active {
  background: var(--dp-accent-subtle);
  color: var(--dp-accent);
  font-weight: 600;
}
```

---

# 14. Login Screen Redesign

The login screen is the **first thing every user sees**. It must feel polished and on-brand.

### Layout

Centered vertically and horizontally on a subtle gradient background:

```text
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│           ┌──────────────────────┐           │
│           │                      │           │
│           │     [✂]              │           │
│           │     Darzi Pro        │           │
│           │     Tailoring        │           │
│           │     Management       │           │
│           │                      │           │
│           │  Username            │           │
│           │  [                ]  │           │
│           │                      │           │
│           │  Password            │           │
│           │  [                ]  │           │
│           │                      │           │
│           │  [     Log In     ]  │           │
│           │                      │           │
│           │  Or log in with PIN  │           │
│           │                      │           │
│           └──────────────────────┘           │
│                                              │
└──────────────────────────────────────────────┘
```

### Specifications

| Property | Value |
|---|---|
| Page background | `linear-gradient(135deg, #F9FAFB, #EEF2FF)` |
| Card max-width | 400px |
| Card padding | 40px |
| Card border-radius | `--dp-radius-xl` (16px) |
| Card shadow | `--dp-shadow-lg` |
| Logo | 40×40px, same accent badge as sidebar |
| Product name | 22px, weight 700 |
| Tagline | 14px, `--dp-text-secondary` |
| Brand spacing | 32px below brand block |
| Inputs | `.dp-input` from §7, full width |
| Login button | `.dp-btn--primary`, full width, height: 44px |
| PIN link | 13px, `--dp-accent`, weight 500, centered below button |

### PIN Login View

When "log in with PIN" is clicked, the form transitions to a numeric pad:

```text
┌──────────────────────┐
│  Enter your PIN      │
│                      │
│     ● ● ○ ○          │  ← Dot indicators
│                      │
│   [1] [2] [3]        │
│   [4] [5] [6]        │  ← NumPad
│   [7] [8] [9]        │
│       [0] [⌫]        │
│                      │
│  Use password instead│
└──────────────────────┘
```

The existing `numeric-pad` shared component is reused here.

---

# 15. Settings Module Redesign

### Layout

Left-nav + right-content split, similar to macOS System Settings or Shopify Settings:

```text
┌──────────────────────────────────────────────┐
│  Settings                                    │
├────────────┬─────────────────────────────────┤
│            │                                 │
│  Shop      │  Shop Profile                   │
│  Users     │                                 │
│  Backup    │  Shop Name                      │
│  About     │  [Darzi Pro              ]      │
│            │                                 │
│            │  Address                        │
│            │  [123 Main Street        ]      │
│            │                                 │
│            │  Phone                          │
│            │  [0300-1234567           ]      │
│            │                                 │
│            │  Receipt Footer                 │
│            │  [Thank you for your... ]       │
│            │                                 │
│            │              [Save Changes]     │
│            │                                 │
└────────────┴─────────────────────────────────┘
```

### Settings Nav

```css
.settings-nav {
  width: 200px;
  padding: 16px;
  border-right: 1px solid var(--dp-border);
  flex-shrink: 0;
}

.settings-nav__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--dp-text-secondary);
  cursor: pointer;
  transition: all var(--dp-transition-normal);
}

.settings-nav__item:hover {
  background: var(--dp-surface-hover);
}

.settings-nav__item--active {
  background: var(--dp-accent-subtle);
  color: var(--dp-accent);
}
```

### Settings Categories

| Category | Content |
|---|---|
| Shop Profile | Shop name, address, phone, logo upload, receipt footer text |
| Users & Roles | User list table, Add User button, role assignment |
| Backup & Restore | Manual backup button, auto-backup toggle, restore file picker |
| About | App version, database path, system info |

All forms use the §7 form system.

---

# 16. Reports Module Redesign

### Layout

```text
┌──────────────────────────────────────────────┐
│  Reports                   [Export PDF] [CSV]│
├──────────────────────────────────────────────┤
│  [Revenue] [Orders] [Customers] [Payments]  │  ← Tab row
├──────────────────────────────────────────────┤
│  Date Range: [Last 30 days ▾]  [Custom ▾]   │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐                 │  ← Summary KPIs
│  └──────┘ └──────┘ └──────┘                 │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  Chart area (ng2-charts)            │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  Data table                         │    │
│  └──────────────────────────────────────┘    │
│                                              │
└──────────────────────────────────────────────┘
```

### Date Range Selector

```css
.date-range-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range-chip {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--dp-border);
  border-radius: 6px;
  background: var(--dp-surface);
  color: var(--dp-text-secondary);
  cursor: pointer;
}

.date-range-chip--active {
  background: var(--dp-accent-subtle);
  color: var(--dp-accent);
  border-color: var(--dp-accent-muted);
}
```

### Chart Color Palette

Charts use V2 design tokens:

| Chart Element | Color |
|---|---|
| Primary line/bar | `--dp-accent` (#6366F1) |
| Revenue area fill | `--dp-accent-subtle` (#EEF2FF) |
| Expense bars | `#F59E0B` |
| Grid lines | `--dp-border-subtle` (#F3F4F6) |
| Axis labels | `--dp-text-tertiary` (#9CA3AF) |

---

# 17. Design Tokens — Complete Reference

```css
:root {
  /* ── Fonts ────────────────────────────────── */
  --dp-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --dp-font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  /* ── Surface & Background ─────────────────── */
  --dp-bg:             #F9FAFB;
  --dp-surface:        #FFFFFF;
  --dp-surface-hover:  #F3F4F6;
  --dp-surface-raised: #FFFFFF;

  /* ── Borders ──────────────────────────────── */
  --dp-border:         #E5E7EB;
  --dp-border-subtle:  #F3F4F6;
  --dp-border-focus:   #818CF8;

  /* ── Text ─────────────────────────────────── */
  --dp-text:           #111827;
  --dp-text-secondary: #6B7280;
  --dp-text-tertiary:  #9CA3AF;
  --dp-text-inverse:   #FFFFFF;

  /* ── Accent (Indigo) ──────────────────────── */
  --dp-accent:         #6366F1;
  --dp-accent-hover:   #4F46E5;
  --dp-accent-subtle:  #EEF2FF;
  --dp-accent-muted:   #C7D2FE;

  /* ── Semantic ─────────────────────────────── */
  --dp-success:        #059669;
  --dp-success-subtle: #ECFDF5;
  --dp-warning:        #D97706;
  --dp-warning-subtle: #FFFBEB;
  --dp-danger:         #DC2626;
  --dp-danger-subtle:  #FEF2F2;
  --dp-info:           #2563EB;
  --dp-info-subtle:    #EFF6FF;

  /* ── Shadows ──────────────────────────────── */
  --dp-shadow-xs:  0 1px 2px 0 rgba(0, 0, 0, 0.03);
  --dp-shadow-sm:  0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04);
  --dp-shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --dp-shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);

  /* ── Radii ────────────────────────────────── */
  --dp-radius-sm:  6px;
  --dp-radius-md:  8px;
  --dp-radius-lg:  12px;
  --dp-radius-xl:  16px;
  --dp-radius-pill: 100px;

  /* ── Spacing ──────────────────────────────── */
  --dp-space-1:  4px;
  --dp-space-2:  8px;
  --dp-space-3:  12px;
  --dp-space-4:  16px;
  --dp-space-5:  20px;
  --dp-space-6:  24px;
  --dp-space-8:  32px;
  --dp-space-10: 40px;
  --dp-space-12: 48px;

  /* ── Transitions ──────────────────────────── */
  --dp-transition-fast:   0.1s ease;
  --dp-transition-normal: 0.15s ease;
  --dp-transition-slow:   0.25s ease;

  /* ── Z-Index Scale ────────────────────────── */
  --dp-z-dropdown: 100;
  --dp-z-sticky:   200;
  --dp-z-modal:    300;
  --dp-z-toast:    400;

  /* ── Layout ───────────────────────────────── */
  --dp-sidebar-width:    240px;
  --dp-sidebar-collapsed: 56px;
  --dp-content-max-width: 1200px;
  --dp-content-padding:  32px;
}
```

---

# 18. Angular Material Overrides

Material components are used for functionality but must be visually overridden to match V2.

## 18.1 Global Resets

```css
/* Remove ripples everywhere */
.mat-mdc-button .mat-ripple,
.mat-mdc-icon-button .mat-ripple,
.mat-mdc-menu-item .mat-ripple,
.mat-mdc-option .mat-ripple,
.mat-mdc-tab .mat-ripple {
  display: none;
}

/* Font family override */
.mat-mdc-form-field,
.mat-mdc-select,
.mat-mdc-option,
.mat-mdc-tab,
.mat-mdc-menu-item,
.mat-mdc-paginator {
  font-family: var(--dp-font-sans) !important;
}
```

## 18.2 Table Overrides

```css
.mat-mdc-header-cell {
  font-size: 12px !important;
  font-weight: 600 !important;
  color: var(--dp-text-tertiary) !important;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mat-mdc-cell {
  font-size: 14px !important;
  color: var(--dp-text) !important;
}
```

## 18.3 Paginator Overrides

```css
.mat-mdc-paginator {
  background: transparent !important;
  border-top: 1px solid var(--dp-border);
  font-size: 13px !important;
  color: var(--dp-text-secondary) !important;
}

.mat-mdc-paginator .mat-mdc-select {
  font-size: 13px !important;
}

.mat-mdc-paginator .mat-mdc-icon-button {
  color: var(--dp-text-secondary) !important;
  width: 32px !important;
  height: 32px !important;
}

.mat-mdc-paginator .mat-mdc-icon-button:hover {
  background: var(--dp-surface-hover) !important;
}
```

## 18.4 Select Panel Overrides

```css
.mat-mdc-select-panel {
  border-radius: var(--dp-radius-md) !important;
  box-shadow: var(--dp-shadow-md) !important;
  border: 1px solid var(--dp-border) !important;
}

.mat-mdc-option {
  font-size: 14px !important;
  min-height: 40px !important;
}

.mat-mdc-option:hover:not(.mdc-list-item--disabled) {
  background: var(--dp-surface-hover) !important;
}

.mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled) {
  background: var(--dp-accent-subtle) !important;
  color: var(--dp-accent) !important;
}
```

## 18.5 Menu Overrides

```css
.mat-mdc-menu-panel {
  border-radius: var(--dp-radius-md) !important;
  box-shadow: var(--dp-shadow-md) !important;
  border: 1px solid var(--dp-border) !important;
  min-width: 160px !important;
}

.mat-mdc-menu-item {
  font-size: 13px !important;
  font-weight: 500 !important;
  min-height: 36px !important;
  border-radius: var(--dp-radius-sm);
  margin: 2px 4px;
}

.mat-mdc-menu-item:hover {
  background: var(--dp-surface-hover) !important;
}
```

## 18.6 Dialog Overrides

```css
.mat-mdc-dialog-container {
  border-radius: var(--dp-radius-lg) !important;
}

.mat-mdc-dialog-surface {
  padding: 0 !important;
}

.cdk-overlay-dark-backdrop {
  background: rgba(0, 0, 0, 0.4) !important;
}
```

## 18.7 Tab Overrides

```css
.mat-mdc-tab-header {
  border-bottom: 1px solid var(--dp-border) !important;
}

.mat-mdc-tab .mdc-tab__text-label {
  font-size: 13px !important;
  font-weight: 500 !important;
  letter-spacing: 0 !important;
}

.mdc-tab-indicator__content--underline {
  border-color: var(--dp-accent) !important;
  border-width: 2px !important;
}
```

## 18.8 Snackbar / Toast Overrides

```css
.mat-mdc-snack-bar-container {
  border-radius: var(--dp-radius-md) !important;
  font-family: var(--dp-font-sans) !important;
}
```

## 18.9 Autocomplete Panel Overrides

```css
.mat-mdc-autocomplete-panel {
  border-radius: var(--dp-radius-md) !important;
  box-shadow: var(--dp-shadow-md) !important;
  border: 1px solid var(--dp-border) !important;
}
```

---

# 19. Micro-Interactions & Motion

## 19.1 Principles

- Motion is **functional**, not decorative
- Transitions are **fast** (100–200ms)
- Easing is `ease` or `ease-out` (never `ease-in` alone)
- No bounce, no spring physics, no parallax

## 19.2 Interaction Catalog

| Element | Trigger | Animation |
|---|---|---|
| Nav item | Hover | Background color fade (150ms) |
| Table row | Hover | Background color fade (100ms) |
| Card | Hover | Border-color change + shadow (150ms) |
| Button (primary) | Hover | Background darken (150ms) |
| Button (secondary) | Hover | Background tint + border darken (150ms) |
| KPI card | Hover | Border-color accent-muted + subtle shadow (150ms) |
| Action icons | Row hover | Opacity 0.4 → 1.0 (150ms) |
| Focus ring | Focus | Border-color accent + 3px accent-subtle ring (150ms) |
| Modal / Dialog | Open | Fade in + scale 0.98→1.0 (200ms ease-out) |
| Command palette | Open | Fade in + scale 0.98→1.0 (150ms ease-out) |
| Context menu | Open | Fade in + scale 0.95→1.0 (100ms ease-out) |
| Toast | Appear | Slide down 8px + fade in (200ms) |
| Page content | Route change | Opacity 0→1 (150ms) |
| Sidebar | Collapse/Expand | Width transition (200ms ease) |

## 19.3 Loading States

**Skeleton loading** for data-heavy views:

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--dp-border-subtle) 25%,
    var(--dp-bg) 50%,
    var(--dp-border-subtle) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--dp-radius-sm);
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

Use `mat-progress-spinner` only for action confirmations (saving, submitting).

## 19.4 Success Toast

When a tailor saves a customer, creates an order, or records a payment, a **success toast** confirms the action.

### Anatomy

```text
┌──────────────────────────────────────┐
│  ✓  Customer "Ahmad Khan" saved      │  ← auto-dismiss 3s
└──────────────────────────────────────┘
```

### Position

Top-right corner, 16px from edges. Stacks downward if multiple toasts.

### Styling

```css
.dp-toast {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: var(--dp-z-toast);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--dp-radius-md);
  font-size: 14px;
  font-weight: 500;
  max-width: 400px;
  animation: toast-in 0.2s ease-out;
}

.dp-toast--success {
  background: var(--dp-success-subtle);
  color: #065F46;
  border: 1px solid #A7F3D0;
}

.dp-toast--error {
  background: var(--dp-danger-subtle);
  color: #991B1B;
  border: 1px solid #FECACA;
}

.dp-toast__icon {
  font-size: 18px;
  flex-shrink: 0;
}

.dp-toast__dismiss {
  margin-left: auto;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
}

.dp-toast__dismiss:hover {
  opacity: 1;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Auto-dismiss

Toasts auto-dismiss after 3 seconds. Hovering pauses the timer. Error toasts persist until manually dismissed.

---

# 20. Keyboard Shortcuts

The PRD requires keyboard shortcuts for common operations. Darzi Pro defines a global shortcut layer.

## 20.1 Shortcut Table

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `⌘K` | Open command palette |
| `Ctrl+N` | New order |
| `Ctrl+B` | Toggle sidebar collapse |
| `Ctrl+1` | Navigate to Dashboard |
| `Ctrl+2` | Navigate to Customers |
| `Ctrl+3` | Navigate to Orders |
| `Ctrl+4` | Navigate to Payments |
| `Ctrl+5` | Navigate to Reports |
| `Ctrl+6` | Navigate to Settings |
| `Escape` | Close modal / dialog / palette, clear search |
| `Enter` | Open selected table row |
| `Ctrl+/` | Show keyboard shortcuts help |

## 20.2 Shortcuts Help Dialog

Accessible via `Ctrl+/` or a `?` icon at the bottom of the sidebar (above collapse toggle). Opens a dialog listing all shortcuts in a two-column layout.

```css
.shortcuts-dialog {
  max-width: 480px;
}

.shortcut-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.shortcut-label {
  font-size: 14px;
  color: var(--dp-text);
}

.shortcut-keys {
  display: flex;
  gap: 4px;
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  font-size: 12px;
  font-family: var(--dp-font-mono);
  font-weight: 600;
  color: var(--dp-text-secondary);
  background: var(--dp-bg);
  border: 1px solid var(--dp-border);
  border-radius: 4px;
}
```

---

# 21. Scroll, Spacing, and Density Reference

## 21.1 Scroll Behavior

| Region | Scroll | Behavior |
|---|---|---|
| Sidebar | Independent `overflow-y: auto` | Scrollbar hidden unless hovered |
| Content area | Primary scroll target | Only region that scrolls |
| Table within card | Contained | Table body scrolls within card, headers sticky |
| Modals | Independent | Content scrolls within modal, max-height 80vh |

## 21.2 Minimum Supported Viewport

| Dimension | Value |
|---|---|
| Minimum width | 1280px |
| Minimum height | 800px |
| Recommended | 1440 × 900+ |

---

# 22. Accessibility Checklist

| Requirement | Implementation |
|---|---|
| Focus visibility | 3px accent-subtle ring on all interactive elements |
| Keyboard focus on table rows | `outline: 2px solid var(--dp-accent-subtle)` on `:focus-visible` |
| Keyboard-revealed actions | `tr:focus-within .actions-cell { opacity: 1 }` |
| Color contrast | All text passes WCAG AA against its background |
| Keyboard navigation | All actions reachable via Tab, Enter, Escape |
| ARIA labels | All icon-only buttons have `aria-label` |
| Unique IDs | All interactive elements have unique `id` attributes |
| Screen reader | Tables use proper `<th>` and `aria-label` on `<table>` |
| Shortcut discoverability | `Ctrl+/` opens shortcuts help |

---

# 23. Implementation Mapping

| Source File | Change Type | Design Section |
|---|---|---|
| `src/renderer/styles.css` | Replace all CSS custom properties with V2 tokens + Material overrides | §17, §18 |
| `layout-shell.component.html` | Remove header, consolidate sidebar with collapse, add user block | §3, §4 |
| `layout-shell.component.css` | Full rewrite with V2 sidebar/content/collapse styling | §3, §4 |
| `layout-shell.component.ts` | Add sidebar collapse signal, keyboard shortcut listener | §4.6, §20 |
| `dashboard.component.html` | Alert banner, KPI grid, quick actions, recent payments | §10 |
| `dashboard.component.css` | Full rewrite with V2 tokens | §10 |
| `customer-list.component.html` | V2 search bar, table markup, context menu | §6, §11 |
| `customer-list.component.css` | V2 table styles, cell patterns | §6, §11 |
| `customer-detail/` | Breadcrumb, profile card + tabbed content | §3.4, §11.2 |
| `customer-form/` | V2 form system with dp-input | §7, §11.3 |
| `order-list.component.html` | V2 filters bar, table, status badges, context menu | §6, §9, §12.1 |
| `order-list.component.css` | Full rewrite with V2 tokens | §6, §9, §12.1 |
| `order-kanban/` | V2 kanban columns, cards, CDK drag-drop | §12.2 |
| `order-detail/` | Breadcrumb, timeline, print button, info grid | §3.4, §12.3, §12.5 |
| `order-wizard/` | Replace mat-stepper with custom vertical stepper | §12.4 |
| `payment-list/` | V2 table system | §6, §13 |
| `payment-detail/` | V2 card system, print button | §5, §13 |
| `payment-form/` | V2 dialog with segmented payment method | §5.4, §13.2 |
| `reports/` | Tab row, date range, chart palette, data table | §16 |
| `settings/` | Left-nav + right-content split | §15 |
| `auth/login.component` | Centered card, brand, dp-input, PIN view | §14 |
| `shared/components/` (NEW) | Command palette, toast, context menu components | §9.3, §19.4, §6.7 |

---

# 24. File-Level Change Constraints

> **Critical**: The following file categories are **never modified** during the redesign:

| Category | Examples | Reason |
|---|---|---|
| Services | `core/services/*.ts` | Business logic boundary |
| Stores | `*/store/*.ts`, `core/store/*.ts` | State management boundary |
| Routes | `app.routes.ts`, `*.routes.ts` | Routing boundary |
| Models | `*/models/*.ts` | Type definition boundary |
| Guards | `core/guards/*.ts` | Auth logic boundary |
| Electron Main | `src/main/**/*` | Main process boundary |
| Preload | `src/preload/**/*` | IPC bridge boundary |
| TypeORM | `database/entities/*.ts`, `config/*.ts` | Data layer boundary |

Only **component template files** (`.html`), **component stylesheet files** (`.css`), **the global stylesheet** (`styles.css`), and **component class files** (`.ts`) — limited to import list and template-helper-only changes — are in scope.
