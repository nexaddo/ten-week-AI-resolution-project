# Personal Resolution Tracker - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Linear/Notion-Inspired Productivity Interface

This goal-tracking application prioritizes clarity, efficiency, and motivational design. Drawing from Linear's clean typography and Notion's intuitive information hierarchy, combined with progress visualization patterns from Asana.

## Core Design Elements

### Typography
- **Primary Font:** Inter (via Google Fonts CDN)
- **Headings:** Font weight 600-700, sizes: text-3xl (dashboard), text-2xl (sections), text-lg (cards)
- **Body Text:** Font weight 400, text-base for primary content, text-sm for metadata
- **Data/Metrics:** Font weight 500-600 for emphasis on numbers and progress

### Layout System
**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4
- Container max-width: max-w-6xl centered

### Component Library

**Dashboard Layout:**
- Top navigation bar with app title, year selector, user profile
- Stats overview cards showing: total resolutions, completed, in-progress, completion rate
- Main content area with two-column layout (lg:grid-cols-3): resolution list (2 cols) + progress summary sidebar (1 col)

**Resolution Cards:**
- Card-based design with subtle borders (border border-gray-200)
- Each card contains: title, category tag, progress bar, deadline, quick actions
- Progress bars use gradient fills with percentage indicators
- Status badges (Not Started, In Progress, Completed, Abandoned)

**Goal Creation Modal:**
- Centered overlay (max-w-2xl)
- Form fields: title, description, category dropdown, target date picker, milestones section
- Milestone builder allows adding multiple checkpoints with deadlines

**Progress Tracking:**
- Visual timeline showing milestones and achievements
- Check-in button to log progress updates
- Notes/journal section for reflection entries
- Streak counter for consecutive check-ins

**Category System:**
- Pre-defined categories: Health & Fitness, Career, Learning, Finance, Relationships, Personal Growth
- Color-coded tags for quick visual identification (using subtle background tints)
- Filter buttons in sidebar for category-based views

**Calendar View:**
- Monthly grid showing deadline markers
- Day cells highlight days with check-ins or milestones
- Click to see details for specific dates

**Achievement Celebrations:**
- Confetti animation (use canvas-confetti library via CDN) on resolution completion
- Achievement badges/icons (from Heroicons)
- Completion certificate modal with share functionality

### Navigation Structure
- Persistent sidebar (hidden on mobile, drawer on tablet): Dashboard, All Resolutions, Categories, Calendar, Achievements, Settings
- Mobile: Bottom tab bar with icons for core sections

### Forms & Inputs
- Text inputs with focus states (ring-2 ring-blue-500)
- Custom checkbox styling for milestone completion
- Date pickers with calendar overlay
- Textarea for descriptions and journal entries

### Data Visualization
- Horizontal progress bars (h-2 rounded-full)
- Circular progress indicators for overall completion
- Simple bar charts showing weekly/monthly progress trends (use Chart.js via CDN)
- Completion percentage displayed prominently (text-2xl font-bold)

### Interactive Elements
- Primary CTA: "Add New Resolution" button (prominent, top-right of dashboard)
- Quick actions: Edit, Delete, Mark Complete (icon buttons)
- Drag-and-drop for priority reordering
- Expandable cards for viewing full resolution details

### Responsive Behavior
- Desktop (lg:): Three-column dashboard, sidebar navigation
- Tablet (md:): Two-column layout, collapsible sidebar
- Mobile: Single column, bottom navigation, card list view

### Micro-interactions (Minimal)
- Smooth progress bar fills on data update
- Fade-in for new resolutions added
- Completion celebration animation (confetti) - only when marking complete

## Images

**No hero image required** - this is a dashboard application, not a marketing page.

**Icon Usage:** Heroicons for all UI icons (categories, actions, navigation)

**Optional Imagery:**
- Empty state illustration when no resolutions exist (use placeholder comment for custom illustration)
- Achievement badge graphics (simple SVG icons)

## Key UX Principles
1. **Immediate Value:** Dashboard shows progress summary at-a-glance
2. **Low Friction:** One-click access to add resolutions and log check-ins
3. **Motivation-Focused:** Visual progress indicators and celebration moments
4. **Flexible Tracking:** Support both quantitative milestones and qualitative journal entries
5. **Year-Long Context:** Timeline view maintains perspective on annual journey