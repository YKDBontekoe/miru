with open("frontend/src/components/ChatBubble.tsx", "r") as f:
    content = f.read()

content = content.replace("Retry\n                  </AppText>", "{t('chat.retry')}\n                  </AppText>")

with open("frontend/src/components/ChatBubble.tsx", "w") as f:
    f.write(content)
