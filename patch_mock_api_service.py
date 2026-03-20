import re

with open("frontend/test/features/rooms/pages/group_chat_page_test.dart", "r") as f:
    content = f.read()

# Fix mock override in test
content = content.replace("Stream<String> streamRoomChat(String roomId, String message)", "Stream<String> streamRoomChat(String roomId, String message, {String? stylePreference})")

with open("frontend/test/features/rooms/pages/group_chat_page_test.dart", "w") as f:
    f.write(content)
