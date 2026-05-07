1. **Debounce Search Query**: Add a local `useDebouncedValue` hook, or just handle debouncing in `useProductivityViewModel`, and expose `setDebouncedSearchQuery` so that typing in the `TextInput` doesn't recalculate data on every keystroke. Use `useDebounce` from `frontend/src/hooks/useDebounce.ts`.
2. **Absolute Imports in `productivity.tsx`**: Change `../../src/...` imports to `@/...`. Wrap or split the long import containing `RenderItemData` and `useProductivityViewModel`.
3. **Fix `useCallback` Import in `productivity.tsx`**: Import `useCallback` directly from 'react' alongside `useMemo` and change `React.useCallback` to `useCallback`.
4. **Absolute Imports in `useProductivityViewModel.ts`**: Change `../../core/models` and `../../store/...` imports to `@/...`. Order imports: react/react-native first, third-party next, then internal.
5. **Memoize `dataToRender`**: Wrap the ternary calculation for `dataToRender` in `useMemo` with proper dependencies.
6. **AbortController for `handleRefresh`**: Implement an AbortController for `handleRefresh` to cancel pending requests when refreshing again or unmounting.
7. **Consolidate `useEffect` Params Logic**: Combine the `openCreateTask` and `openCreateNote` param parsing in `useProductivityViewModel.ts` using a helper to stay DRY.
8. **Handle Errors**: Make `useProductivityViewModel` return `error` (fetch failure). In `productivity.tsx` empty state block, show an error UI with a retry `Pressable` if `error` exists.
