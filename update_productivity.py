import re

# Update frontend/app/(main)/productivity.tsx

with open("frontend/app/(main)/productivity.tsx", "r") as f:
    content = f.read()

# Fix ListEmptyComponent
content = content.replace(
    '''        ListEmptyComponent={
          <ProductivityEmptyState
            activeTab={state.activeTab}
            searchQuery={state.searchQuery}
            onCreateNote={() => actions.setShowCreateNote(true)}
            onCreateTask={() => actions.setShowCreateTask(true)}
          />
        }''',
    '''        ListEmptyComponent={
          state.isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <AppText>Loading...</AppText>
            </View>
          ) : (
            <ProductivityEmptyState
              activeTab={state.activeTab}
              searchQuery={state.searchQuery}
              onCreateNote={() => actions.setShowCreateNote(true)}
              onCreateTask={() => actions.setShowCreateTask(true)}
            />
          )
        }'''
)

# Fix relative imports
content = content.replace("import { AppText } from '../../src/components/AppText';", "import { AppText } from '@/components/AppText';")
content = content.replace("import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';", "import { CreateNoteModal } from '@/components/productivity/CreateNoteModal';")
content = content.replace("import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';", "import { CreateTaskModal } from '@/components/productivity/CreateTaskModal';")
content = content.replace("import { NoteCard } from '../../src/components/productivity/NoteCard';", "import { NoteCard } from '@/components/productivity/NoteCard';")
content = content.replace("import { TaskCard } from '../../src/components/productivity/TaskCard';", "import { TaskCard } from '@/components/productivity/TaskCard';")
content = content.replace("import { ProductivityHeader } from '../../src/components/productivity/ProductivityHeader';", "import { ProductivityHeader } from '@/components/productivity/ProductivityHeader';")
content = content.replace("import { ProductivityTabs } from '../../src/components/productivity/ProductivityTabs';", "import { ProductivityTabs } from '@/components/productivity/ProductivityTabs';")
content = content.replace("import { ProductivityEmptyState } from '../../src/components/productivity/ProductivityEmptyState';", "import { ProductivityEmptyState } from '@/components/productivity/ProductivityEmptyState';")
content = content.replace("import { TodayPlanBanner } from '../../src/components/productivity/TodayPlanBanner';", "import { TodayPlanBanner } from '@/components/productivity/TodayPlanBanner';")
content = content.replace("import { theme } from '../../src/core/theme';", "import { theme } from '@/core/theme';")
content = content.replace("import { CalendarEvent, Note, Task } from '../../src/core/models';", "import { CalendarEvent, Note, Task } from '@/core/models';")
content = content.replace(
    "import {\n  RenderItemData,\n  useProductivityViewModel,\n} from '../../src/hooks/viewmodels/useProductivityViewModel';",
    "import {\n  RenderItemData,\n  useProductivityViewModel,\n} from '@/hooks/viewmodels/useProductivityViewModel';"
)
content = content.replace("import { useTheme } from '../../src/hooks/useTheme';", "import { useTheme } from '@/hooks/useTheme';")

with open("frontend/app/(main)/productivity.tsx", "w") as f:
    f.write(content)
