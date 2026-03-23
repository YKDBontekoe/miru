import json

with open('frontend/src/core/i18n/en.json', 'r') as f:
    data = json.load(f)

if 'home' not in data:
    data['home'] = {}
if 'greeting' not in data['home']:
    data['home']['greeting'] = {}
data['home']['greeting']['morning'] = "Good morning"
data['home']['greeting']['afternoon'] = "Good afternoon"
data['home']['greeting']['evening'] = "Good evening"

if 'tasks' not in data['home']:
    data['home']['tasks'] = {}
data['home']['tasks']['open_count'] = "Tasks \u00b7 {{count}} open"

with open('frontend/src/core/i18n/en.json', 'w') as f:
    json.dump(data, f, indent=2)

with open('frontend/src/core/i18n/he.json', 'r') as f:
    he_data = json.load(f)

if 'home' not in he_data:
    he_data['home'] = {}
if 'greeting' not in he_data['home']:
    he_data['home']['greeting'] = {}
he_data['home']['greeting']['morning'] = "בוקר טוב"
he_data['home']['greeting']['afternoon'] = "צהריים טובים"
he_data['home']['greeting']['evening'] = "ערב טוב"

if 'tasks' not in he_data['home']:
    he_data['home']['tasks'] = {}
he_data['home']['tasks']['open_count'] = "משימות \u00b7 {{count}} פתוחות"
he_data['home']['tasks']['all_done'] = "משימות \u00b7 הושלם!"
he_data['home']['tasks']['caught_up'] = "הכל מעודכן!"

if 'sections' not in he_data['home']:
    he_data['home']['sections'] = {}
he_data['home']['sections']['quick_actions'] = "פעולות מהירות"
he_data['home']['sections']['your_agents'] = "הסוכנים שלך"
he_data['home']['sections']['recent_chats'] = "צ'אטים אחרונים"

if 'actions' not in he_data['home']:
    he_data['home']['actions'] = {}
he_data['home']['actions']['chats'] = "צ'אטים"
he_data['home']['actions']['agents'] = "סוכנים"
he_data['home']['actions']['done'] = "הושלם"
he_data['home']['actions']['new_chat'] = "צ'אט חדש"
he_data['home']['actions']['new_agent'] = "סוכן חדש"
he_data['home']['actions']['new_note'] = "פתק חדש"
he_data['home']['actions']['new_task'] = "משימה חדשה"

with open('frontend/src/core/i18n/he.json', 'w') as f:
    json.dump(he_data, f, indent=2)
