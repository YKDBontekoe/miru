1. **Create ViewModel**: Create `frontend/src/hooks/useProductivityViewModel.ts` to extract the logic from `frontend/app/(main)/productivity.tsx`. This ViewModel will manage state like `activeTab`, `searchQuery`, filtering, grouping, and generating the "Today plan".
2. **Decompose UI**: In `frontend/app/(main)/productivity.tsx`, move parts of the UI out if needed, but primarily hook it up to the new ViewModel. The 850-line file has too much logic mixed with UI.
3. **Clean Code**: Update imports, use `useTheme` instead of hardcoded design tokens where possible (or keep UI the same visually but just extract the logic).
4. **Pre-commit**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
