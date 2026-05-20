1. **Decompose `frontend/app/(main)/productivity.tsx` (God Class)**
   - The file is 858 lines long and handles fetching, complex filtering, grouping logic, and multiple rendering parts for notes, tasks, and events.
   - I will extract the business/state logic into a dedicated custom hook `frontend/src/hooks/useProductivityViewModel.ts`.
   - I will extract the inline Event card view from `renderItem` into a dedicated `frontend/src/components/productivity/EventCard.tsx`.
   - I will extract `renderItem` to be outside of the component to prevent inline rendering and optimize `FlatList` performance.
2. **Decouple Logic to ViewModel**
   - Create `useProductivityViewModel` hook to encapsulate:
     - All `useState` (tabs, search queries, creation modal visibility).
     - Fetching side-effects `useEffect`.
     - Memoized filtering for notes, tasks, and events.
     - `getTaskPriority`, `prioritizedTasks`, `mixedData`, `todayData` logic.
     - `generateTodayPlan` functionality.
   - Ensure the hook exposes only what the UI needs.
3. **Clarify and Harden UI Rendering**
   - Extract `EventCard` component using the styling currently inline in `productivity.tsx`.
   - Update `productivity.tsx` to use `useProductivityViewModel` and only focus on UI layout and routing parameter reactions.
   - Refactor `renderItem` to be a pure function defined outside the component, passing necessary actions via `extraData` or the item payload itself.
4. **Pre-commit Steps**
   - Complete testing, verification, and code style checks via tools provided.
5. **Submit**
   - Submit the refactoring changes with a proper message.
