# 🎨 Admin Dashboard Design Guide

## Design Philosophy

Dashboard admin baru mengikuti prinsip **Modern, Professional, & User-Friendly** dengan inspirasi dari dashboard populer seperti Vercel, Linear, dan modern SaaS applications.

## 🎯 Design Goals

1. **Konsistensi**: Sama seperti voter page (header, footer, color scheme)
2. **Modern**: Gradient, glassmorphism, smooth animations
3. **Professional**: Dark sidebar, clean cards, proper spacing
4. **Mobile-First**: Responsive di semua devices
5. **Accessible**: Clear hierarchy, good contrast, readable text

## 🎨 Visual Hierarchy

### Level 1: Primary Actions
- **Sidebar Navigation**: Always accessible, dark theme
- **Header Actions**: Quick access (notifications, profile)
- **Primary Buttons**: Large, gradient, high contrast

### Level 2: Content Sections
- **Stats Cards**: Eye-catching gradients di top
- **Main Content**: White cards dengan subtle shadows
- **Section Headers**: Bold, clear separation

### Level 3: Secondary Information
- **Badges**: Status indicators
- **Metadata**: Dates, descriptions
- **Helper Text**: Gray, smaller size

## 🎨 Color System

### Primary Palette
```css
/* Blue - Primary Actions */
from-blue-600 to-indigo-600
Hex: #2563EB → #4F46E5

/* Green - Success/Active */
from-green-500 to-green-600
Hex: #22C55E → #16A34A

/* Orange - Warning/Inactive */
from-orange-500 to-orange-600
Hex: #F97316 → #EA580C

/* Red - Danger/Delete */
bg-red-600
Hex: #DC2626
```

### Dark Sidebar
```css
/* Background Gradient */
from-slate-900 via-slate-800 to-slate-900
Hex: #0F172A → #1E293B → #0F172A

/* Text Colors */
- Active: white (#FFFFFF)
- Inactive: slate-300 (#CBD5E1)
- Labels: slate-500 (#64748B)
```

### Background
```css
/* Main Background */
from-gray-50 via-blue-50/30 to-indigo-50/20
Creates subtle gradient effect
```

## 📐 Spacing System

### Cards & Containers
```css
padding: 1.5rem (24px)  /* p-6 */
padding: 2rem (32px)    /* p-8 */
margin-bottom: 1.5rem   /* mb-6 */
margin-bottom: 2rem     /* mb-8 */
```

### Gaps
```css
gap: 1rem     /* gap-4 - buttons */
gap: 1.5rem   /* gap-6 - cards grid */
gap: 2rem     /* gap-8 - sections */
```

### Border Radius
```css
2xl: 1rem     /* Cards, major elements */
xl:  0.75rem  /* Buttons, inputs */
lg:  0.5rem   /* Small elements */
full: 9999px  /* Badges, avatars */
```

## 🎭 Animation System

### Hover Effects
```css
/* Cards */
hover:shadow-2xl
hover:-translate-y-1
transition-all

/* Buttons */
hover:scale-105
hover:shadow-xl
transition-transform

/* Links */
hover:text-blue-700
transition-colors
```

### Entrance Animations
```css
/* Modal */
fadeIn: opacity 0 → 1
scaleIn: scale 0.9 → 1
duration: 0.2s

/* Cards */
slide-up: translateY(20px) → 0
duration: 0.4s
```

### Status Indicators
```css
/* Active Status */
animate-pulse
bg-green-500
duration: 2s
```

## 📱 Responsive Breakpoints

### Mobile (< 768px)
```css
- Sidebar: Hidden, toggle via hamburger
- Grid: 1 column
- Cards: Full width
- Padding: Reduced (p-4)
- Font: Slightly smaller
```

### Tablet (768px - 1023px)
```css
- Sidebar: Collapsible
- Grid: 2 columns
- Cards: Medium size
- Padding: Normal (p-6)
```

### Desktop (>= 1024px)
```css
- Sidebar: Always visible
- Grid: 3 columns
- Cards: Optimal size
- Padding: Comfortable (p-8)
```

### Large Desktop (>= 1280px)
```css
- Max width: 7xl (1280px)
- Extra spacing
- Larger text
```

## 🧩 Component Anatomy

### Stats Card
```
┌─────────────────────────────────┐
│ [Gradient Background]           │
│                                 │
│ Label (small)        [Icon]     │
│ 42 (large)           [Box]      │
│                                 │
│ [Hover: Scale 1.05]             │
└─────────────────────────────────┘
```

### Election Card
```
┌─────────────────────────────────┐
│ Title              [Status]     │
│                                 │
│ Description...                  │
│                                 │
│ 📅 Start Date                   │
│ ⏰ End Date                      │
│                                 │
│ [Kelola Button - Primary]       │
│ [Toggle] [Delete Icon]          │
└─────────────────────────────────┘
```

### Sidebar Layout
```
┌─────────────────┐
│ [Logo] Admin    │ ← Brand
│ Panel           │
├─────────────────┤
│ 🏠 Dashboard    │ ← Navigation
│ 📋 Pemilihan    │
├─────────────────┤
│ Quick Actions   │ ← Shortcuts
│ + Buat          │
├─────────────────┤
│                 │ ← Spacer
│                 │
├─────────────────┤
│ [AD] Admin      │ ← User
│ admin@email.com │
│ [Logout Button] │
└─────────────────┘
```

## 🎨 Design Patterns

### 1. Card Pattern
- Always white background
- Shadow on hover
- Rounded corners (2xl)
- Padding 6-8
- Border subtle (optional)

### 2. Button Pattern
- Primary: Gradient blue
- Secondary: Outlined
- Danger: Solid red
- Icon + Text combination
- Hover: Scale or shadow

### 3. Badge Pattern
- Small, rounded-full
- Color-coded by status
- Uppercase text
- Ring border for emphasis

### 4. Modal Pattern
- Dark backdrop with blur
- Centered, animated entrance
- Max-width for readability
- Clear hierarchy (icon, title, content, actions)

## 🔤 Typography Scale

### Headings
```css
h1: 3xl-4xl (30-36px) font-bold
h2: 2xl-3xl (24-30px) font-bold
h3: xl-2xl (20-24px) font-semibold
h4: lg-xl (18-20px) font-medium
```

### Body
```css
Regular: base (16px) font-normal
Small: sm (14px) font-normal
Tiny: xs (12px) font-medium
```

### Special
```css
Stats: 4xl-7xl font-bold (numbers)
Labels: xs uppercase tracking-wider
Mono: mono font (codes, IDs)
```

## 🎯 Interactive States

### Focus States
```css
ring-2 ring-blue-500
ring-offset-2
outline-none
```

### Disabled States
```css
opacity-50
cursor-not-allowed
```

### Loading States
```css
animate-spin (spinner)
disabled state
"Loading..." text
```

## 🌈 Gradient Combinations

### Card Backgrounds
```css
from-white to-gray-50        /* Subtle */
from-white to-blue-50/30     /* Header */
from-blue-50 to-indigo-50    /* Special */
```

### Button Gradients
```css
from-blue-600 to-indigo-600  /* Primary */
from-green-500 to-green-600  /* Success */
from-red-500 to-red-600      /* Danger */
```

### Background Gradients
```css
from-gray-50 via-blue-50/30 to-indigo-50/20  /* Page */
from-slate-900 via-slate-800 to-slate-900    /* Sidebar */
```

## 🎨 Icon Usage

### Navigation Icons
- Outlined style
- 20px (w-5 h-5)
- Consistent stroke-width: 2

### Action Buttons
- 16px (w-4 h-4) for small
- 20px (w-5 h-5) for regular
- 24px (w-6 h-6) for large

### Placement
- Left of text for buttons
- Right of text for external links
- Above text for cards
- Centered for icons-only

## 🎭 Shadow System

### Elevations
```css
sm:   0 1px 2px 0 rgba(0,0,0,0.05)
md:   0 4px 6px -1px rgba(0,0,0,0.1)
lg:   0 10px 15px -3px rgba(0,0,0,0.1)
xl:   0 20px 25px -5px rgba(0,0,0,0.1)
2xl:  0 25px 50px -12px rgba(0,0,0,0.25)
```

### Usage
```css
Default: shadow-md
Hover: shadow-xl or shadow-2xl
Modal: shadow-2xl
Buttons: shadow-lg
```

## 📏 Component Sizing

### Buttons
```css
Small:   px-3 py-1.5 text-sm
Regular: px-4 py-2 text-base
Large:   px-6 py-3 text-lg
```

### Input Fields
```css
Height: py-2 (32px) or py-2.5 (40px)
Width: full or specific (w-64, w-full)
```

### Cards
```css
Width: Auto (grid determines)
Min-height: Based on content
Padding: p-6 or p-8
```

## 🎨 Accessibility

### Contrast Ratios
- Text on white: >= 4.5:1 (WCAG AA)
- Large text: >= 3:1
- Interactive elements: Clear focus states

### Interactive Elements
- Minimum touch target: 44x44px
- Focus visible: ring-2
- Keyboard navigable

### Colors
- Not relying on color alone
- Icons + text labels
- Status indicators with text

## 🚀 Performance

### Animations
- Use transform/opacity (GPU accelerated)
- Avoid layout thrashing
- Reasonable durations (0.2s - 0.4s)

### Images
- Use Next.js Image component
- Lazy loading by default
- Proper sizing

### Code Splitting
- Dynamic imports for heavy components
- Route-based splitting
- Component-level splitting

---

## 📖 Usage Examples

### Creating a New Admin Page

```tsx
import AdminLayout from '@/components/AdminLayout'

export default function NewPage() {
  return (
    <AdminLayout>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Page Title
        </h1>
        <p className="text-gray-600">Description</p>
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Your cards here */}
      </div>
    </AdminLayout>
  )
}
```

### Creating a Stats Card

```tsx
<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-blue-100 text-sm font-medium mb-1">Label</p>
      <p className="text-4xl font-bold">42</p>
    </div>
    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
      {/* Icon here */}
    </div>
  </div>
</div>
```

### Creating an Action Button

```tsx
<button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all">
  <svg className="w-5 h-5" {...iconProps} />
  <span>Action Text</span>
</button>
```

---

**🎨 Design system ini memberikan konsistensi dan kualitas visual yang tinggi untuk seluruh admin dashboard!**

