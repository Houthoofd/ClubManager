# Professors UI Components

This directory contains all UI components for the professors feature.

## Components

### ProfessorCard

A card component for displaying a single professor's information.

**Props:**
- `professor: ProfessorListItem` - Professor data
- `onClick?: (professor) => void` - Click handler
- `onEdit?: (professor) => void` - Edit handler
- `onDelete?: (professor) => void` - Delete handler
- `onToggleActive?: (professor) => void` - Toggle active/inactive handler
- `showActions?: boolean` - Show action buttons (default: true)
- `compact?: boolean` - Compact mode (default: false)

### ProfessorsList

A comprehensive list/grid component for displaying professors with advanced features.

**Features:**
- ✅ Grid and list view modes
- ✅ Real-time search with 300ms debounce
- ✅ Multiple filters (status, specialty)
- ✅ Sorting (by name, specialty, course count)
- ✅ Pagination with page size selector (10, 25, 50, 100)
- ✅ Bulk selection and actions
- ✅ CRUD operations (edit, delete, toggle active)
- ✅ Loading states with skeleton loaders
- ✅ Empty and error states
- ✅ Confirmation modals

**Props:**
```typescript
interface ProfessorsListProps {
  onProfessorClick?: (professor: ProfessorListItem) => void;
  onEdit?: (professor: ProfessorListItem) => void;
  onDelete?: (professor: ProfessorListItem) => void;
  viewMode?: 'grid' | 'list';  // Default: 'grid'
  showFilters?: boolean;  // Default: true
  compact?: boolean;  // Default: false
}
```

**Example Usage:**

```tsx
import { ProfessorsList } from '@/features/professors';
import { useNavigate } from 'react-router-dom';

function ProfessorsPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <ProfessorsList
        viewMode="grid"
        showFilters={true}
        compact={false}
        onProfessorClick={(professor) => {
          navigate(`/professors/${professor.id}`);
        }}
        onEdit={(professor) => {
          navigate(`/professors/${professor.id}/edit`);
        }}
        onDelete={(professor) => {
          console.log('Professor deleted:', professor.nom_complet);
        }}
      />
    </div>
  );
}
```

**Simple Usage (minimal props):**

```tsx
import { ProfessorsList } from '@/features/professors';

function SimpleProfessorsList() {
  return <ProfessorsList />;
}
```

**Hooks Used:**

The component automatically uses these hooks from the model layer:
- `useProfessors(params)` - Fetches professors with filters and pagination
- `useDeleteProfessor()` - Handles professor deletion
- `useToggleProfessorActive()` - Handles activate/deactivate

**State Management:**

The component manages the following state internally:
- View mode (grid/list)
- Search query with debounce
- Status filter (tous/actifs/inactifs)
- Specialty filter
- Sort field and order
- Pagination (page, page size)
- Selected professor IDs for bulk actions
- Modal states (delete, toggle)

**Layout Structure:**

```
┌─────────────────────────────────────────────┐
│ Header                                      │
│ - Title with count                          │
│ - View toggle (grid/list)                   │
├─────────────────────────────────────────────┤
│ Filters (if showFilters=true)              │
│ - Search bar                                │
│ - Status filter                             │
│ - Specialty filter                          │
│ - Sort options                              │
│ - Clear filters button                      │
│ - Bulk actions (when items selected)        │
├─────────────────────────────────────────────┤
│ Content                                     │
│ - Loading: Skeleton loaders                │
│ - Error: Error state with retry            │
│ - Empty: Empty state                        │
│ - No results: No results state              │
│ - Grid/List: Professor cards or table       │
├─────────────────────────────────────────────┤
│ Pagination                                  │
│ - Results count                             │
│ - Page size selector                        │
│ - Page navigation                           │
│ - Jump to page                              │
├─────────────────────────────────────────────┤
│ Modals                                      │
│ - Delete confirmation                       │
│ - Toggle active confirmation                │
└─────────────────────────────────────────────┘
```

**Responsive Design:**

Grid columns:
- Mobile (< 640px): 1 column
- Tablet (640px - 1024px): 2 columns
- Desktop (1024px+): 3 columns
- Large Desktop (1280px+) with compact=true: 4 columns

**Filtering & Sorting:**

The component supports:
- Search by name or first name (debounced 300ms)
- Filter by status (all, active, inactive)
- Filter by specialty (dynamic list from data)
- Sort by: nom, prenom, specialite, nombre_cours
- Sort order: asc, desc

**Bulk Actions:**

Users can:
1. Select multiple professors using checkboxes
2. Select all on current page
3. Perform bulk activate/deactivate
4. Selection is cleared on page change

**Performance:**

- Debounced search (300ms) to reduce API calls
- React Query caching with 2-minute stale time
- Skeleton loaders for smooth loading states
- Optimistic updates for toggle actions
- Pagination to limit data fetched

**Accessibility:**

- Proper ARIA labels
- Keyboard navigation support
- Focus management in modals
- Screen reader friendly
- Semantic HTML

**Customization:**

You can customize the component by:
1. Setting initial `viewMode` prop
2. Hiding filters with `showFilters={false}`
3. Using `compact` mode for denser display
4. Providing custom handlers for click, edit, delete
5. Styling with Tailwind CSS classes

## Coming Soon

- `ProfessorForm` - Form component for creating/editing professors
- `ProfessorDetail` - Detail view component with full information
- `ProfessorStats` - Statistics dashboard component
- `ProfessorSchedule` - Weekly schedule view component