import re

with open("frontend/app/(main)/home.tsx", "r") as f:
    content = f.read()

# getGreeting string updates
content = content.replace("return 'Good morning';", "return t('greeting.morning');")
content = content.replace("return 'Good afternoon';", "return t('greeting.afternoon');")
content = content.replace("return 'Good evening';", "return t('greeting.evening');")

# stat cards
content = content.replace("Chats\n            </AppText>", "{t('home.actions.chats')}\n            </AppText>")
content = content.replace("Agents\n            </AppText>", "{t('home.actions.agents')}\n            </AppText>")
content = content.replace("Done\n            </AppText>", "{t('home.actions.done')}\n            </AppText>")

# quick action labels
content = content.replace(">Quick Actions<", ">{t('home.sections.quick_actions')}<")
content = content.replace(">New Chat<", ">{t('home.actions.new_chat')}<")
content = content.replace(">New Agent<", ">{t('home.actions.new_agent')}<")
content = content.replace(">New Note<", ">{t('home.actions.new_note')}<")
content = content.replace(">New Task<", ">{t('home.actions.new_task')}<")

# sections
content = content.replace(">Your Agents<", ">{t('home.sections.your_agents')}<")
content = content.replace(">Recent Chats<", ">{t('home.sections.recent_chats')}<")

# pending tasks title
# Tasks \u00b7 All done!
content = content.replace(">Tasks \u00b7 All done!<", ">{t('home.tasks.all_done')}<")
content = content.replace(">You're all caught up!<", ">{t('home.tasks.caught_up')}<")
content = content.replace(">Tasks \u00b7 {pendingTasks.length} open<", ">{t('home.tasks.open_count', { count: pendingTasks.length })}<")

with open("frontend/app/(main)/home.tsx", "w") as f:
    f.write(content)
