--- frontend/app/(main)/chat.tsx
+++ frontend/app/(main)/chat.tsx
@@ -346,12 +346,38 @@
   const { rooms, fetchRooms, isLoadingRooms } = useChatStore();
   const { agents, fetchAgents } = useAgentStore();
   const [showCreateModal, setShowCreateModal] = useState(false);
-  const [roomAgents] = useState<Record<string, Agent[]>>({});
+  const [roomAgents, setRoomAgents] = useState<Record<string, Agent[]>>({});

   useEffect(() => {
     fetchRooms();
     fetchAgents();
   }, [fetchRooms, fetchAgents]);
+
+  useEffect(() => {
+    if (rooms.length === 0) return;
+    let isMounted = true;
+
+    const loadRoomAgents = async () => {
+      try {
+        const agentPromises = rooms.map(async (room) => {
+          const roomAgentsData = await ApiService.getRoomAgents(room.id);
+          return { roomId: room.id, agents: roomAgentsData };
+        });
+        const results = await Promise.all(agentPromises);
+        if (!isMounted) return;
+        const newRoomAgents: Record<string, Agent[]> = {};
+        for (const res of results) {
+          newRoomAgents[res.roomId] = res.agents;
+        }
+        setRoomAgents(newRoomAgents);
+      } catch {}
+    };
+
+    loadRoomAgents();
+    return () => {
+      isMounted = false;
+    };
+  }, [rooms]);

   const renderRoomItem = React.useCallback(
     ({ item: room }: { item: ChatRoom }) => (
