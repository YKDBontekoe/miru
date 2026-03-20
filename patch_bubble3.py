with open("frontend/lib/core/design_system/components/chat_bubble.dart", "r") as f:
    content = f.read()

content = content.replace("_AssistantBubble(\n              text: text,", "_AssistantBubble(\n              text: text,\n              onFeedback: onFeedback,\n              feedback: feedback,")

with open("frontend/lib/core/design_system/components/chat_bubble.dart", "w") as f:
    f.write(content)
