# Design QA — Legal / Causas responsive repair

- Source visual truth:
  - `C:\Users\keanu\AppData\Local\Temp\codex-clipboard-db640abd-74d5-4442-8384-611de6ccf7e1.png` (2815 × 601 px)
  - `C:\Users\keanu\AppData\Local\Temp\codex-clipboard-7da8825a-1ea0-415e-a601-d6d8ad4e1eff.png` (2797 × 569 px)
- Implementation: `https://aviarockets.cl/app.html?v=legal-causes-responsive-20260929-2`
- Browser evidence: Codex in-app browser, authenticated Fhevia session.
- Validation viewport: 747 CSS px wide at device scale 1; screenshot output 699 px content width after browser chrome.
- State: Legal → Causas, page 1 and page 2, 25 rows per page.

## Full-view comparison evidence

The reference showed the filter actions, result count and page-size control extending beyond the right edge. The first implementation pass added responsive groups but retained a 1,680 px min-content width inherited from the table. The second pass constrained every Legal content child to the 666 px content viewport. Measured production result: document width 732 px within a 747 px viewport; toolbar, pagination, table viewport and export card each end at x=699 px with no page-level horizontal overflow.

## Focused region comparison evidence

- Filters: all five filters, “Limpiar filtros”, result count and page-size control now wrap inside the card.
- Pagination: “Anterior / Página / Siguiente” is visible above and below the table. Keyboard activation advanced production from page 1 to page 2 (`Mostrando 26–50`).
- Table: the viewport is 649 px wide and its content is 1,680 px wide, confirming horizontal scrolling is isolated to the table. Its maximum height keeps the horizontal scrollbar reachable.
- Export: the oversized vertical card is now a compact one-line desktop treatment and a stacked mobile treatment; the primary blue button remains within the viewport.
- Console: zero browser errors during production validation.

## Required fidelity surfaces

- Fonts and typography: existing AVIA type styles, weights and hierarchy preserved.
- Spacing and layout rhythm: filters use a five/three/two/one-column responsive grid; actions wrap independently; export padding reduced.
- Colors and visual tokens: existing navy surfaces, borders and blue primary token preserved.
- Image quality and assets: no image or brand asset changes.
- Copy and content: existing labels and database-backed counts preserved; only an accessible table-scroll label was added.

## Comparison history

1. P1 — page children inherited the table’s 1,680 px minimum width. Fixed by constraining `#app-product-config`, `#cause-list-rows`, toolbar and direct children to `min-width: 0; max-width: 100%`.
2. P1 — next-page controls were off-screen. Fixed with responsive pagination above and below the table; production navigation to page 2 verified.
3. P1 — horizontal table access required reaching the bottom of 25 rows. Fixed with a bounded internal scroll area and sticky table header.
4. P2 — download treatment was visually oversized. Fixed with compact grid layout and a standard primary action.

## Findings

No actionable P0, P1 or P2 findings remain.

## Follow-up polish

None required for this repair.

final result: passed
