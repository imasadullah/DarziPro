# Darzi Pro — UI Architecture Specification

## Overview
This document translates the Darzi Pro UI/UX Design System V2 into a reusable, desktop-first Angular 20 UI architecture. 
It focuses strictly on the presentation layer, leveraging Angular standalone components, and enforces a strict separation of concerns (no business logic, services, or state management inside presentation components).

## Container vs Presentational Component Strategy
Darzi Pro uses a strict smart (container) / dumb (presentational) component architecture:

*   **Presentational Components (UI Components):**
    *   Focus entirely on how things look.
    *   Have no dependencies on services, stores, or backend APIs.
    *   Receive data exclusively via `@Input()`.
    *   Emit events exclusively via `@Output()`.
    *   Use OnPush change detection for performance.
    *   Represented by all components defined in this document.
*   **Container Components (Feature Components):**
    *   Focus on how things work (data fetching, state management, orchestrating UI components).
    *   Subscribe to Signals, Services, or State.
    *   Pass data down to presentational components.
    *   Are explicitly *not* covered in this UI architecture document.

## UI Layer Boundaries
1.  **Core UI Layer:** Pure, domain-agnostic components (Buttons, Inputs, Cards). Usable in any application.
2.  **Domain UI Layer:** Darzi-specific presentational components (Measurement Grid, KPI Cards). Reusable across different features within Darzi Pro.
3.  **Feature/Page Layer:** Containers composing Domain and Core UI components to form complete pages (e.g., Customers Page, Dashboard Page).

---

## Recommended Folder Structure

```text
src/
└── app/
    └── shared/
        └── ui/
            ├── layout/           # App shell, headers, cards
            ├── navigation/       # Sidebar, breadcrumbs, menus
            ├── forms/            # Inputs, selects, measurement fields
            ├── data-display/     # Tables, badges, empty states, avatars
            ├── feedback/         # Dialogs, modals, toasts
            ├── dashboard/        # KPI cards, charts
            └── domain/           # Darzi-specific shared UI
                ├── customer/     
                ├── order/        
                ├── measurement/  
                └── payment/      
```

---

## Component Dependency Hierarchy

1.  **Level 0 (No dependencies):** `DpButton`, `DpBadge`, `DpIcon`, `DpCurrencyDisplay`
2.  **Level 1 (Depends on Level 0):** `DpInput`, `DpCard`, `DpEmptyState`, `DpNavItem`
3.  **Level 2 (Depends on Level 1 & 0):** `DpPageHeader`, `DpMeasurementField`, `DpTable`, `DpSidebar`
4.  **Level 3 (Complex Compositions):** `DpAppShell` (Uses Sidebar), `DpMeasurementGrid` (Uses MeasurementField), `DpCommandPalette` (Uses Input, List, Badge)

---

## 1. Shared UI Components

### `DpButtonComponent`
*   **Purpose:** Standardized trigger for user actions.
*   **Responsibilities:** Renders primary, secondary, ghost, danger, and icon-only button variants. Handles disabled states and loading spinners.
*   **Inputs:** `variant` ('primary' | 'secondary' | 'ghost' | 'danger' | 'icon'), `disabled` (boolean), `loading` (boolean), `icon` (string).
*   **Outputs:** `clicked` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** Everywhere (Forms, Headers, Dialogs, Tables).

### `DpBadgeComponent`
*   **Purpose:** Visual indicator for status or counts.
*   **Responsibilities:** Displays a colored pill/badge based on semantic intent.
*   **Inputs:** `color` ('success' | 'warning' | 'danger' | 'info' | 'default'), `text` (string).
*   **Outputs:** None.
*   **Reusability:** High (Core UI).
*   **Where used:** Tables, Order Details, Customer Profiles.

### `DpEmptyStateComponent`
*   **Purpose:** Friendly placeholder when no data exists.
*   **Responsibilities:** Renders an icon, title, and descriptive text. Centers itself in its container.
*   **Inputs:** `icon` (string), `title` (string), `description` (string).
*   **Outputs:** None.
*   **Reusability:** High (Core UI).
*   **Where used:** Empty tables, dashboard states with no metrics, empty search results.

---

## 2. Layout Components

### `DpAppShellComponent`
*   **Purpose:** The main application layout wrapper.
*   **Responsibilities:** Coordinates the fixed sidebar and scrollable main content area. Manages sidebar collapse state visually.
*   **Inputs:** `sidebarCollapsed` (boolean).
*   **Outputs:** `toggleSidebar` (Event).
*   **Reusability:** Low (App specific).
*   **Where used:** Root application component (`app.component.html`).

### `DpPageHeaderComponent`
*   **Purpose:** Consistent page title and action area.
*   **Responsibilities:** Displays page title, optional subtitle, and projects header actions (buttons) via content projection.
*   **Inputs:** `title` (string), `subtitle` (string).
*   **Outputs:** None.
*   **Reusability:** High (Core UI).
*   **Where used:** Top of every main feature page (Dashboard, Customers, Orders).

### `DpCardComponent`
*   **Purpose:** Standard content container.
*   **Responsibilities:** Renders a surface with a border/shadow. Supports flush (no padding) and interactive (hover elevation) variants. Projects header, body, and footer content.
*   **Inputs:** `variant` ('default' | 'flush' | 'raised'), `interactive` (boolean).
*   **Outputs:** `clicked` (Event - if interactive).
*   **Reusability:** High (Core UI).
*   **Where used:** Everywhere holding grouped data or forms.

### `DpBreadcrumbComponent`
*   **Purpose:** Hierarchical navigation for detail pages.
*   **Responsibilities:** Shows the path from a parent list to the current detail view. Includes a back button.
*   **Inputs:** `parentLabel` (string), `parentRoute` (string), `currentLabel` (string).
*   **Outputs:** `navigateBack` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** Order Detail, Customer Detail, Payment Detail pages.

---

## 3. Form Components

### `DpInputComponent`
*   **Purpose:** Standard text input field.
*   **Responsibilities:** Wraps a native input with a label, placeholder, helper text, and error state styling.
*   **Inputs:** `label` (string), `placeholder` (string), `type` (string), `value` (string/number), `error` (string), `required` (boolean), `helperText` (string).
*   **Outputs:** `valueChange` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** All forms (Customer creation, settings, login).

### `DpSearchComponent`
*   **Purpose:** Dedicated search bar.
*   **Responsibilities:** Renders a search input with a magnifying glass icon and optional keyboard shortcut hint.
*   **Inputs:** `placeholder` (string), `shortcutHint` (string), `value` (string).
*   **Outputs:** `searchQuery` (Event), `focus` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** List pages, top of long tables.

### `DpTextareaComponent`
*   **Purpose:** Multi-line text input.
*   **Responsibilities:** Renders an auto-expanding or fixed-height textarea.
*   **Inputs:** `label` (string), `placeholder` (string), `value` (string), `rows` (number).
*   **Outputs:** `valueChange` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** Notes fields, addresses.

### `DpSelectComponent`
*   **Purpose:** Standard dropdown selection.
*   **Responsibilities:** Wraps native select or Angular Material select for consistent form styling.
*   **Inputs:** `label` (string), `options` (Array<{label: string, value: any}>), `value` (any), `error` (string).
*   **Outputs:** `selectionChange` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** Forms requiring predefined choices.

---

## 4. Table/Grid Components

### `DpTableComponent`
*   **Purpose:** Standardized data grid.
*   **Responsibilities:** Renders rows and columns with consistent spacing, hover states, and headers. Wraps in a flush card automatically.
*   **Inputs:** `columns` (Array of column defs), `data` (Array of objects), `loading` (boolean).
*   **Outputs:** `rowClicked` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** Customers list, Orders list, Payments list.

### `DpPaginatorComponent`
*   **Purpose:** Navigation for large datasets.
*   **Responsibilities:** Displays current range (e.g., "Showing 1-20 of 1,247") and provides next/prev/page-number controls.
*   **Inputs:** `totalItems` (number), `pageSize` (number), `currentPage` (number).
*   **Outputs:** `pageChanged` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** Bottom of `DpTableComponent`.

### `DpActionsCellComponent`
*   **Purpose:** Inline actions within table rows.
*   **Responsibilities:** Renders a container that is transparent until the parent row is hovered or focused, displaying icon buttons.
*   **Inputs:** `actions` (Array of action definitions: icon, color, tooltip).
*   **Outputs:** `actionTriggered` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** The right-most column of most tables.

---

## 5. Dashboard Components

### `DpKpiCardComponent`
*   **Purpose:** High-impact metric display.
*   **Responsibilities:** Renders a large numeric value, a title, a colored icon block, and optional context/trend text. Provides hover elevation.
*   **Inputs:** `title` (string), `value` (string | number), `icon` (string), `iconTint` ('blue'|'indigo'|'amber'|'red'|'green'|'teal'), `trendText` (string).
*   **Outputs:** `clicked` (Event).
*   **Reusability:** Medium (Domain UI).
*   **Where used:** Dashboard page.

---

## 6. Order Management Components

### `DpOrderStatusBadgeComponent`
*   **Purpose:** Domain-specific badge for the tailoring pipeline.
*   **Responsibilities:** Maps specific order statuses (Pending, Cutting, Stitching, Finishing, Ready, Delivered, Cancelled) to precise colors defined in V2 design.
*   **Inputs:** `status` (string).
*   **Outputs:** None.
*   **Reusability:** Medium (Domain UI).
*   **Where used:** Order tables, Order Detail view.

### `DpOrderPriorityIndicatorComponent`
*   **Purpose:** Highlights urgent orders.
*   **Responsibilities:** Renders a thick, colored left-border on rows or cards to indicate High/Urgent priority.
*   **Inputs:** `priority` ('normal' | 'high' | 'urgent').
*   **Outputs:** None.
*   **Reusability:** Medium (Domain UI).
*   **Where used:** Order table rows, Kanban boards.

---

## 7. Customer Management Components

### `DpCustomerIdentityCellComponent`
*   **Purpose:** Consistent display of a customer's identity.
*   **Responsibilities:** Renders an avatar circle (initials) next to the customer's full name.
*   **Inputs:** `name` (string), `avatarUrl` (string - optional).
*   **Outputs:** None.
*   **Reusability:** Medium (Domain UI).
*   **Where used:** Tables (Customer, Orders), Command Palette results.

---

## 8. Measurement Components

### `DpMeasurementGridComponent`
*   **Purpose:** Layout container for tailoring measurements.
*   **Responsibilities:** Arranges measurement fields into a compact 3-column or 4-column grid.
*   **Inputs:** `columns` (3 | 4).
*   **Outputs:** None.
*   **Reusability:** Medium (Domain UI).
*   **Where used:** Measurement forms.

### `DpMeasurementFieldComponent`
*   **Purpose:** Highly specialized numeric input for tailors.
*   **Responsibilities:** Renders a taller input with a larger font (16px) and an inline, non-interactive unit suffix (e.g., "in"). Tabular-nums enabled.
*   **Inputs:** `label` (string), `value` (number), `unit` (string - default 'in').
*   **Outputs:** `valueChange` (Event).
*   **Reusability:** Medium (Domain UI).
*   **Where used:** Inside `DpMeasurementGridComponent`.

### `DpMeasurementCopyBtnComponent`
*   **Purpose:** Action to duplicate past measurements.
*   **Responsibilities:** Renders a subtle inline text button specifically styled for the measurement section header.
*   **Inputs:** `disabled` (boolean).
*   **Outputs:** `copyRequested` (Event).
*   **Reusability:** Low (Domain specific).
*   **Where used:** Measurement form section headers.

### `DpMeasurementNotesComponent`
*   **Purpose:** Textarea specific for tailoring notes/instructions.
*   **Responsibilities:** Similar to Textarea but pre-configured with styling suitable for stitching/fabric instructions.
*   **Inputs:** `label` (string), `value` (string).
*   **Outputs:** `valueChange` (Event).
*   **Reusability:** Low (Domain specific).
*   **Where used:** Below measurement grids.

---

## 9. Payment Components

### `DpCurrencyDisplayComponent`
*   **Purpose:** Standardized money formatting.
*   **Responsibilities:** Uses Angular number pipe to format currency, ensures tabular-nums, applies specific colors based on state (due vs clear), and adds the "Rs" prefix.
*   **Inputs:** `amount` (number), `state` ('normal' | 'due' | 'clear').
*   **Outputs:** None.
*   **Reusability:** High (Core/Domain UI).
*   **Where used:** Order totals, Payment lists, Dashboard revenue.

### `DpPaymentDialogFormComponent`
*   **Purpose:** Form for receiving payments.
*   **Responsibilities:** Coordinates inputs for amount, date, and method to receive a payment for an order.
*   **Inputs:** `orderId` (string), `balanceDue` (number).
*   **Outputs:** `paymentSubmitted` (Event), `cancelled` (Event).
*   **Reusability:** Low (Domain specific).
*   **Where used:** Order detail page, Payment list page.

---

## 10. Report Components

### `DpFilterBarComponent`
*   **Purpose:** Container for report and list filters.
*   **Responsibilities:** Flex container that wraps filter chips horizontally.
*   **Inputs:** None (uses content projection for chips).
*   **Outputs:** None.
*   **Reusability:** High (Core UI).
*   **Where used:** Reports page, Complex list views.

### `DpFilterChipComponent`
*   **Purpose:** Toggleable filter criterion.
*   **Responsibilities:** Renders a clickable pill that visually indicates if it is active.
*   **Inputs:** `label` (string), `active` (boolean).
*   **Outputs:** `toggled` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** Inside `DpFilterBarComponent`.

---

## 11. Dialog/Modal Components

### `DpDialogContainerComponent`
*   **Purpose:** Standardized modal wrapper, shedding Material's default styling.
*   **Responsibilities:** Provides the backdrop, entrance animation, padding, standard title, description, and footer layout. Projects content into the body.
*   **Inputs:** `title` (string), `description` (string).
*   **Outputs:** `close` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** Wraps all specific dialogs.

### `DpConfirmDialogComponent`
*   **Purpose:** Prompts for destructive or critical actions.
*   **Responsibilities:** Presents a warning message and Confirm/Cancel buttons. Highlights the confirm button in red if dangerous.
*   **Inputs:** `title` (string), `message` (string), `confirmText` (string), `isDanger` (boolean).
*   **Outputs:** `confirmed` (Event), `cancelled` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** Deleting customers, cancelling orders.

### `DpCommandPaletteComponent`
*   **Purpose:** Global fuzzy search and quick actions.
*   **Responsibilities:** Renders a floating modal centered on screen with a search input and categorized list of navigable results.
*   **Inputs:** `isOpen` (boolean), `results` (Array of categorized results).
*   **Outputs:** `closed` (Event), `itemSelected` (Event), `searchQuery` (Event).
*   **Reusability:** High (App level).
*   **Where used:** Triggered globally via `Ctrl+K`.

---

## 12. Navigation Components

### `DpSidebarComponent`
*   **Purpose:** Main application navigation container.
*   **Responsibilities:** Houses the brand block, primary/secondary navigation lists, collapse toggle, and user block. Handles its own width transitions.
*   **Inputs:** `collapsed` (boolean), `user` (User object).
*   **Outputs:** `toggleCollapse` (Event), `logout` (Event).
*   **Reusability:** Low (App specific).
*   **Where used:** Inside `DpAppShellComponent`.

### `DpNavItemComponent`
*   **Purpose:** Individual sidebar link.
*   **Responsibilities:** Renders an icon and label. Handles active state styling (subtle tint, not full fill) and hover effects. Adapts to collapsed sidebar state (icon only + tooltip).
*   **Inputs:** `label` (string), `icon` (string), `isActive` (boolean), `collapsed` (boolean).
*   **Outputs:** `navigated` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** Inside `DpSidebarComponent`.

### `DpUserBlockComponent`
*   **Purpose:** Displays current user identity and logout action.
*   **Responsibilities:** Renders avatar, name, and role at the bottom of the sidebar. Handles collapsed state gracefully.
*   **Inputs:** `name` (string), `role` (string), `collapsed` (boolean).
*   **Outputs:** `logoutClicked` (Event).
*   **Reusability:** Low (App specific).
*   **Where used:** Inside `DpSidebarComponent`.

### `DpContextMenuComponent`
*   **Purpose:** Custom right-click menu for desktop power users.
*   **Responsibilities:** Renders a floating menu at cursor coordinates, bypassing the browser default right-click menu.
*   **Inputs:** `items` (Array of menu items: label, icon, action type), `xPos` (number), `yPos` (number), `isOpen` (boolean).
*   **Outputs:** `itemClicked` (Event), `closed` (Event).
*   **Reusability:** High (Core UI).
*   **Where used:** Over table rows (Orders, Customers).
