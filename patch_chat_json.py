import json

with open('frontend/src/core/i18n/en.json', 'r') as f:
    en_data = json.load(f)

if 'chat' not in en_data:
    en_data['chat'] = {}
en_data['chat'].update({
    "start_conversation": "Start a conversation",
    "add_agent_to_start": "Add an agent to get started.",
    "add_an_agent": "Add an Agent",
    "no_agents_create": "No agents yet. Create one in the Agents tab.",
    "message_placeholder": "Message {{name}}...",
    "room_agents_status_one": "{{names}} is in this room.",
    "room_agents_status_other": "{{names}} are in this room."
})

with open('frontend/src/core/i18n/en.json', 'w') as f:
    json.dump(en_data, f, indent=2)


with open('frontend/src/core/i18n/he.json', 'r') as f:
    he_data = json.load(f)

if 'chat' not in he_data:
    he_data['chat'] = {}

he_data['chat'].update({
    "start_conversation": "התחל שיחה",
    "add_agent_to_start": "הוסף סוכן כדי להתחיל.",
    "add_an_agent": "הוסף סוכן",
    "no_agents_create": "אין סוכנים עדיין. צור אחד בכרטיסיית הסוכנים.",
    "message_placeholder": "הודעה ל-{{name}}...",
    "room_agents_status_one": "{{names}} נמצא בחדר זה.",
    "room_agents_status_other": "{{names}} נמצאים בחדר זה."
})

with open('frontend/src/core/i18n/he.json', 'w') as f:
    json.dump(he_data, f, indent=2)
