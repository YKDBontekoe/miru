Debt Identified:
The file `frontend/app/(main)/productivity.tsx` was a "God Class" containing over 850 lines of code, managing UI rendering, local state (tabs, priorities, search queries), data orchestration, complex filtering, grouping logic, and generating a "Today plan". It also hardcoded colors from design tokens. This violated the Single Responsibility Principle and made testing and maintenance difficult.

Refactored Code:
I have decomposed the logic into a new ViewModel `frontend/src/hooks/viewmodels/useProductivityViewModel.ts`, which now manages all the state, formatting, and filtering logic, while leaving `frontend/app/(main)/productivity.tsx` purely responsible for orchestrating the UI. I also moved inline styles to adhere to dynamic theming by importing and dynamically injecting colours from `useTheme`.

Structural Note:
This extraction improves modularity and clarifies boundaries. The logic in `useProductivityViewModel` can now be tested in isolation from React components, and `productivity.tsx` is dramatically simplified (down to ~570 lines), making the view layer declarative and decoupled from the business logic.
