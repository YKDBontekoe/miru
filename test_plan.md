1.  **Decompose & Decouple `ChatBubble` (frontend/src/components/ChatBubble.tsx)**:
    -   *Issue*: The `ChatBubble` component is a "God Widget" (over 250 lines). It mixes Markdown styling rules, date formatting logic, agent color generation, error/retry state rendering, user vs. agent branching logic, and animation logic directly inside the main file.
    -   *Action*:
        -   Extract the date formatting helper (`formatTime`) to a utility file or separate boundary function.
        -   Extract the color generation (`getAgentColor`) and theme extraction into a separate styles/utils file.
        -   Break down `ChatBubble` into two distinct sub-components: `UserChatBubble.tsx` and `AgentChatBubble.tsx`, each having its specific concern and style.
        -   Extract Markdown styles to a dedicated file or outside the component to prevent recreation on every render.
        -   Extract Retry logic to a `ChatBubbleRetryButton` component.

2.  **Decompose & Decouple `ChatRoomScreen` (frontend/app/(main)/chat/[id].tsx)**:
    -   *Issue*: Over 270 lines. Mixes hub connection lifecycle, agent loading, layout definitions, and complex list rendering.
    -   *Action*:
        -   Extract the empty state logic to `ChatRoomEmptyState.tsx`.
        -   Move the `useEffect` hooks that manage hub connection and agent fetching to a custom hook (e.g., `useChatRoomSetup`).
        -   Ensure that UI building blocks (like the message list and error views) are clean and do not "leak logic" into the render methods directly.

3.  **Run formatting & tests**:
    -   Ensure UI renders cleanly without breaking behavior (Behavioral Integrity).
    -   Follow standard formatting (100 char limit).

4.  **Complete pre commit steps**:
    -   Complete pre commit steps to make sure proper testing, verifications, reviews and reflections are done.

5.  **Submit the change**.
