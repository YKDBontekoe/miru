import re

with open("app/domain/chat/service.py", "r") as f:
    content = f.read()

# Make sure we pass room_summary into run_crew_task inside run_room_chat_ws
content = content.replace(
    """        try:
            result_text = await CrewOrchestrator.execute_crew_task(
                room_agents=room_agents,
                user_message=user_message,
                user_id=user_id,
                user_msg_id=user_msg.id,
                step_callback=step_callback,
                accept_language=accept_language,
                conversation_history=conversation_history,
                memory_context=memory_context,
            )""",
    """        try:
            # Check room summary to pass as context
            room = await self.chat_repo.get_room(room_id)
            room_summary = room.summary if room else None

            result_text = await CrewOrchestrator.execute_crew_task(
                room_agents=room_agents,
                user_message=user_message,
                user_id=user_id,
                user_msg_id=user_msg.id,
                step_callback=step_callback,
                accept_language=accept_language,
                conversation_history=conversation_history,
                memory_context=memory_context,
                room_summary=room_summary,
            )""",
)

content = content.replace(
    """            asyncio.create_task(  # noqa: RUF006
                self.bg_service.store_memories_background(
                    user_id, room_id, user_message, responded_agents, result_text, agent_names
                )
            )""",
    """            asyncio.create_task(  # noqa: RUF006
                self.bg_service.store_memories_background(
                    user_id, room_id, user_message, responded_agents, result_text, agent_names
                )
            )

            # Fire background task to update room summary if conversation gets long
            if len(conversation_history) >= CONVERSATION_HISTORY_LIMIT - 5:
                asyncio.create_task(  # noqa: RUF006
                    self.bg_service.update_room_summary_background(
                        room_id, conversation_history
                    )
                )""",
)


with open("app/domain/chat/service.py", "w") as f:
    f.write(content)
