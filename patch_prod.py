import re

with open("frontend/app/(main)/productivity.tsx", "r") as f:
    content = f.read()

# Replace strings with t() calls
reps = {
    "'Title required', 'Please enter a title for your note.'": "t('productivity.title_required'), t('productivity.enter_title')",
    "'Error', 'Failed to create note. Please try again.'": "t('productivity.error'), t('productivity.failed_create_note')",
    "'Title required', 'Please enter a task title.'": "t('productivity.title_required'), t('productivity.enter_task_title')",
    "'Error', 'Failed to create task. Please try again.'": "t('productivity.error'), t('productivity.failed_create_task')",
    "'Delete', 'Are you sure?'": "t('productivity.delete'), t('productivity.are_you_sure')",
    ">Save Note<": ">{t('productivity.save_note')}<",
    ">Add Task<": ">{t('productivity.add_task')}<",
    ">Title<": ">{t('productivity.title')}<",
    ">Content<": ">{t('productivity.content')}<",
    "placeholder=\"e.g. Discussed AI agents...\"": "placeholder={t('productivity.note_placeholder')}",
    "placeholder=\"e.g. Review PR...\"": "placeholder={t('productivity.task_placeholder')}",
    ">Task<": ">{t('productivity.task')}<",
    "{tab === 'notes' ? 'Notes' : 'Tasks'}": "{tab === 'notes' ? t('productivity.notes') : t('productivity.tasks')}",
    "Productivity\n          </AppText>": "{t('productivity.title')}\n          </AppText>",
    "No notes yet": "{t('productivity.no_notes')}",
    "Write something down to remember it later.": "{t('productivity.no_notes_desc')}",
    "No tasks yet": "{t('productivity.no_tasks')}",
    "Add a task to keep track of what needs to be done.": "{t('productivity.no_tasks_desc')}"
}

for k, v in reps.items():
    content = content.replace(k, v)

# Fix issue where t might not be available inside CreateNoteModal and CreateTaskModal
# Both modals are likely not having const { t } = useTranslation(); inside them
def inject_hook(content, func_name):
    pattern = rf"function {func_name}\(\{{[^\}}]+\}}\s*:\s*\{{[^\}}]+\}}\)\s*\{{"
    match = re.search(pattern, content)
    if match:
        hook = "\n  const { t } = useTranslation();"
        insertion = match.end()
        content = content[:insertion] + hook + content[insertion:]
    else:
        # maybe simple props
        pattern = rf"function {func_name}\([\s\S]*?\)\s*\{{"
        match = re.search(pattern, content)
        if match:
            hook = "\n  const { t } = useTranslation();"
            insertion = match.end()
            content = content[:insertion] + hook + content[insertion:]
    return content

content = inject_hook(content, "CreateNoteModal")
content = inject_hook(content, "CreateTaskModal")

with open("frontend/app/(main)/productivity.tsx", "w") as f:
    f.write(content)
