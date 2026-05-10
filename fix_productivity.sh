sed -i -e "s|import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';|import { CreateNoteModal } from '@/components/productivity/CreateNoteModal';|g" frontend/app/\(main\)/productivity.tsx
sed -i -e "s|import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';|import { CreateTaskModal } from '@/components/productivity/CreateTaskModal';|g" frontend/app/\(main\)/productivity.tsx
sed -i -e "s|import { NoteCard } from '../../src/components/productivity/NoteCard';|import { NoteCard } from '@/components/productivity/NoteCard';|g" frontend/app/\(main\)/productivity.tsx
sed -i -e "s|import { TaskCard } from '../../src/components/productivity/TaskCard';|import { TaskCard } from '@/components/productivity/TaskCard';|g" frontend/app/\(main\)/productivity.tsx
sed -i -e "s|import { theme } from '../../src/core/theme';|import { theme } from '@/core/theme';|g" frontend/app/\(main\)/productivity.tsx
sed -i -e "s|import { DESIGN_TOKENS } from '@/core/design/tokens';|import { DESIGN_TOKENS } from '@/core/design/tokens';|g" frontend/app/\(main\)/productivity.tsx
sed -i -e "s|} from '../../src/hooks/viewmodels/useProductivityViewModel';|} from '@/hooks/viewmodels/useProductivityViewModel';|g" frontend/app/\(main\)/productivity.tsx
sed -i -e "s|} from '../../src/components/productivity/ProductivityWidgets';|} from '@/components/productivity/ProductivityWidgets';|g" frontend/app/\(main\)/productivity.tsx
sed -i -e "s|import { CalendarEvent, Note, Task } from '../../src/core/models';|import { CalendarEvent, Note, Task } from '@/core/models';|g" frontend/app/\(main\)/productivity.tsx

sed -i -e "s|import { AppText } from '../AppText';|import { AppText } from '@/components/AppText';|g" frontend/src/components/productivity/ProductivityWidgets.tsx
sed -i -e "s|import { theme } from '../../core/theme';|import { theme } from '@/core/theme';|g" frontend/src/components/productivity/ProductivityWidgets.tsx
sed -i -e "s|import { DESIGN_TOKENS } from '@/core/design/tokens';|import { DESIGN_TOKENS } from '@/core/design/tokens';|g" frontend/src/components/productivity/ProductivityWidgets.tsx
sed -i -e "s|} from '../../hooks/viewmodels/useProductivityViewModel';|} from '@/hooks/viewmodels/useProductivityViewModel';|g" frontend/src/components/productivity/ProductivityWidgets.tsx
sed -i -e "s|import { CalendarEvent } from '../../core/models';|import { CalendarEvent } from '@/core/models';|g" frontend/src/components/productivity/ProductivityWidgets.tsx

sed -i -e "s|import { CalendarEvent, Note, Task } from '../../core/models';|import { CalendarEvent, Note, Task } from '@/core/models';|g" frontend/src/hooks/viewmodels/useProductivityViewModel.ts
sed -i -e "s|import { useProductivityStore } from '../../store/useProductivityStore';|import { useProductivityStore } from '@/store/useProductivityStore';|g" frontend/src/hooks/viewmodels/useProductivityViewModel.ts
