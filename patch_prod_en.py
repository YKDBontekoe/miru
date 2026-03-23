import json

with open('frontend/src/core/i18n/en.json', 'r') as f:
    data = json.load(f)

if 'productivity' not in data:
    data['productivity'] = {}

data['productivity'].update({
    "title_required": "Title required",
    "enter_title": "Please enter a title for your note.",
    "error": "Error",
    "failed_create_note": "Failed to create note. Please try again.",
    "enter_task_title": "Please enter a task title.",
    "failed_create_task": "Failed to create task. Please try again.",
    "delete": "Delete",
    "are_you_sure": "Are you sure?",
    "save_note": "Save Note",
    "add_task": "Add Task",
    "title": "Title",
    "content": "Content",
    "note_placeholder": "e.g. Discussed AI agents...",
    "task_placeholder": "e.g. Review PR...",
    "task": "Task",
    "notes": "Notes",
    "tasks": "Tasks",
    "no_notes": "No notes yet",
    "no_notes_desc": "Write something down to remember it later.",
    "no_tasks": "No tasks yet",
    "no_tasks_desc": "Add a task to keep track of what needs to be done."
})

data['chat']['retry'] = "Retry"

with open('frontend/src/core/i18n/en.json', 'w') as f:
    json.dump(data, f, indent=2)

with open('frontend/src/core/i18n/he.json', 'r') as f:
    he_data = json.load(f)

if 'productivity' not in he_data:
    he_data['productivity'] = {}

he_data['productivity'].update({
    "title_required": "נדרשת כותרת",
    "enter_title": "אנא הזן כותרת לפתק שלך.",
    "error": "שגיאה",
    "failed_create_note": "נכשל ביצירת פתק. נסה שוב.",
    "enter_task_title": "אנא הזן כותרת למשימה.",
    "failed_create_task": "נכשל ביצירת משימה. נסה שוב.",
    "delete": "מחק",
    "are_you_sure": "האם אתה בטוח?",
    "save_note": "שמור פתק",
    "add_task": "הוסף משימה",
    "title": "כותרת",
    "content": "תוכן",
    "note_placeholder": "לדוגמה: דיון על סוכני בינה מלאכותית...",
    "task_placeholder": "לדוגמה: בדיקת בקשת משיכה...",
    "task": "משימה",
    "notes": "פתקים",
    "tasks": "משימות",
    "no_notes": "אין פתקים עדיין",
    "no_notes_desc": "כתוב משהו כדי לזכור אותו מאוחר יותר.",
    "no_tasks": "אין משימות עדיין",
    "no_tasks_desc": "הוסף משימה כדי לעקוב אחר מה שצריך לעשות."
})

he_data['chat']['retry'] = "נסה שוב"

with open('frontend/src/core/i18n/he.json', 'w') as f:
    json.dump(he_data, f, indent=2)
