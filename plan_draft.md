1. **Refactor `ChatInlineBanner.tsx`**
   - Replace raw Tailwind hex classes with `StyleSheet.create()`.
   - Use `DESIGN_TOKENS` for error/success/info tones.
   - Use `theme.spacing` and `theme.borderRadius`.
2. **Refactor `RoomCard.tsx`**
   - Convert `className` usage with hardcoded hexes to a structured `StyleSheet`.
   - Use `DESIGN_TOKENS.colors`, `theme.spacing`, `theme.borderRadius`, and `theme.typography`.
   - Remove inline styles and `className` strings with raw hex codes.
3. **Refactor `RoomPromptRail.tsx`**
   - Convert `className` to `StyleSheet.create()`.
   - Map colors like `#DDE8E0` to `DESIGN_TOKENS.colors.border`, etc.
   - Apply `DESIGN_TOKENS.shadow` for shadow styling.
4. **Refactor `ChatActionSheet.tsx`**
   - Remove hardcoded colors from `className`.
   - Build a `StyleSheet` leveraging `theme.spacing`, `DESIGN_TOKENS.colors`, and `theme.borderRadius`.
5. **Refactor `ChatRoomHeader.tsx`**
   - Convert raw tailwind string styles to structured `StyleSheet` objects.
   - Remove hardcoded hex strings and use `DESIGN_TOKENS.colors`.
6. **Refactor `ChatListHeader.tsx`**
   - Convert the complex hex-laden UI (`bg-[#0F3D31]`, etc.) into structured `StyleSheet` objects.
   - Apply `DESIGN_TOKENS` and `theme`.
7. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
