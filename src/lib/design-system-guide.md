# Enterprise Design System Guide

## Overview
DesiCargo's enterprise design system provides a comprehensive set of components, patterns, and guidelines for building professional, accessible, and consistent user interfaces throughout the application.

## Core Principles

### 1. **Professional & Modern**
- Clean, sophisticated visual hierarchy
- Premium feel with subtle shadows and gradients
- Consistent spacing and typography
- Professional color palette

### 2. **Accessible & Inclusive** 
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios

### 3. **Performance Optimized**
- Minimal re-renders
- Efficient animations
- Lazy loading components
- Optimized bundle sizes

### 4. **Data-Dense & Functional**
- Information-rich interfaces
- Smart defaults and suggestions
- Advanced filtering and search
- Real-time data visualization

## Design Token System

### Colors
```typescript
// Primary Colors (Professional Blue)
primary: {
  50: '#E6F0FF',
  500: '#0066FF', // Main brand color
  600: '#0052CC',
  900: '#001433'
}

// Secondary Colors (Sophisticated Teal)
secondary: {
  50: '#E6F5F5',
  500: '#009999',
  900: '#001F1F'
}

// Semantic Colors
success: { 500: '#00AF69' }
warning: { 500: '#FF9900' }
error: { 500: '#FF3333' }
info: { 500: '#0087FF' }
```

### Typography
```typescript
fontFamily: {
  sans: ['Inter', 'system-ui'],
  mono: ['JetBrains Mono', 'monospace'],
  display: ['Cal Sans', 'Inter']
}

fontSize: {
  xs: '0.75rem',   // 12px
  sm: '0.875rem',  // 14px  
  base: '1rem',    // 16px
  lg: '1.125rem',  // 18px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem' // 30px
}
```

### Spacing (8px base grid)
```typescript
spacing: {
  1: '0.25rem', // 4px
  2: '0.5rem',  // 8px
  4: '1rem',    // 16px
  6: '1.5rem',  // 24px
  8: '2rem',    // 32px
  12: '3rem',   // 48px
  16: '4rem'    // 64px
}
```

## Component Architecture

### Enhanced Card System

#### Basic Card
```tsx
<Card variant="default" | "elevated" | "outlined" | "glass">
  <CardHeader>
    <CardTitle size="sm" | "base" | "lg">Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

#### Interactive Cards
```tsx
<Card 
  variant="elevated" 
  interactive 
  gradient
  className="hover:scale-[1.02] transition-transform"
>
  {/* Content */}
</Card>
```

#### Metric Cards
```tsx
<MetricCard
  title="Total Revenue"
  value="₹1,23,456"
  change={{ value: 12.5, type: 'increase' }}
  icon={<DollarSign className="h-5 w-5" />}
  trend="up"
/>
```

### Enhanced Button System

#### Button Variants
```tsx
<Button variant="default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient" | "premium">
  Button Text
</Button>
```

#### Button with Icons
```tsx
<Button 
  variant="gradient"
  leftIcon={<Plus className="h-4 w-4" />}
  rightIcon={<ArrowRight className="h-4 w-4" />}
  loading={isLoading}
>
  Create New
</Button>
```

#### Icon Buttons
```tsx
<IconButton
  variant="outline"
  size="icon" | "icon-sm" | "icon-lg"
  icon={<Settings className="h-4 w-4" />}
  aria-label="Settings"
/>
```

#### Button Groups
```tsx
<ButtonGroup orientation="horizontal" | "vertical">
  <Button variant="outline">Option 1</Button>
  <Button variant="outline">Option 2</Button>
  <Button variant="outline">Option 3</Button>
</ButtonGroup>
```

### Data Visualization

#### Stats Cards
```tsx
<StatsCard
  title="Active Users"
  value={1234}
  change={{ value: 8.2, type: 'increase' }}
  icon={<Users className="h-5 w-5" />}
  variant="gradient"
  chart={<MiniChart data={chartData} />}
  onClick={() => navigateToDetails()}
/>
```

#### Stats Grid
```tsx
<StatsGrid columns={1 | 2 | 3 | 4}>
  <StatsCard {...props1} />
  <StatsCard {...props2} />
  <StatsCard {...props3} />
  <StatsCard {...props4} />
</StatsGrid>
```

#### Animated Counter
```tsx
<AnimatedCounter 
  value={12345} 
  duration={2000}
  prefix="₹"
  suffix="/month"
/>
```

### Advanced Data Table

#### Basic Usage
```tsx
<DataTable
  data={articles}
  columns={[
    {
      id: 'name',
      header: 'Name',
      accessor: (row) => row.name,
      sortable: true
    },
    {
      id: 'price',
      header: 'Price',
      accessor: (row) => row.price,
      cell: (row) => formatCurrency(row.price),
      align: 'right'
    }
  ]}
  searchable
  selectable
  onSelectionChange={handleSelection}
  actions={(row) => <RowActions row={row} />}
  striped
  hoverable
  stickyHeader
/>
```

## Layout Patterns

### Page Header Pattern
```tsx
<div className="bg-gradient-to-r from-primary-50 to-secondary-50 -mx-6 px-6 py-8 border-b">
  <div className="flex items-start justify-between">
    <div>
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <div className="p-3 bg-white rounded-xl shadow-md">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
        Page Title
      </h1>
      <p className="text-neutral-600 mt-1">Page description</p>
    </div>
    
    <div className="flex items-center gap-6">
      <MiniStats title="Metric" value="123" />
      <Button variant="gradient">Primary Action</Button>
    </div>
  </div>
</div>
```

### Action Bar Pattern
```tsx
<Card className="p-4">
  <div className="flex flex-col lg:flex-row gap-4">
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
      <Input placeholder="Search..." className="pl-10" />
    </div>
    
    <div className="flex items-center gap-2">
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList>
          <TabsTrigger value="grid"><Grid className="h-4 w-4" /></TabsTrigger>
          <TabsTrigger value="list"><List className="h-4 w-4" /></TabsTrigger>
        </TabsList>
      </Tabs>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Sort</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {/* Sort options */}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ButtonGroup>
        <Button variant="outline">Import</Button>
        <Button variant="outline">Export</Button>
      </ButtonGroup>
      
      <Button variant="gradient">Add New</Button>
    </div>
  </div>
</Card>
```

### Form Layout Pattern
```tsx
<Card variant="elevated" className="shadow-xl">
  <div className="bg-gradient-to-r from-primary-50 to-secondary-50 -mx-6 px-6 py-8 mb-6">
    {/* Form Header */}
  </div>
  
  <CardContent className="space-y-6">
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-6">
        {/* Form fields */}
      </TabsContent>
    </Tabs>
  </CardContent>
  
  <div className="px-6 py-4 bg-neutral-50 border-t flex justify-between">
    <Button variant="ghost">Cancel</Button>
    <Button variant="gradient" type="submit">Save</Button>
  </div>
</Card>
```

## Animation Guidelines

### Micro-Interactions
```css
/* Button hover effect */
.button {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* Card hover effect */
.card:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}
```

### Page Transitions
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.98 }}
    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### Loading States
```tsx
// Skeleton loading
<div className="space-y-3">
  {[...Array(5)].map((_, i) => (
    <Skeleton key={i} className="h-16" />
  ))}
</div>

// Animated loading
<div className="flex items-center gap-2">
  <Loader2 className="h-4 w-4 animate-spin" />
  <span>Loading...</span>
</div>
```

## Accessibility Standards

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Clear focus indicators
- Logical tab order
- Escape key handling for modals

### Screen Readers
- Semantic HTML structure
- Proper ARIA labels
- Alternative text for images
- Live regions for dynamic content

### Color Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Color is not the only indicator

## Performance Guidelines

### Component Optimization
```tsx
// Use React.memo for pure components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>
})

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data)
}, [data])

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // Handle click
}, [dependency])
```

### Bundle Optimization
```tsx
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Dynamic imports for utilities
const utils = await import('./utils')
```

## Testing Strategy

### Component Testing
```tsx
// Test component rendering
test('renders article card correctly', () => {
  render(<ArticleCard article={mockArticle} />)
  expect(screen.getByText(mockArticle.name)).toBeInTheDocument()
})

// Test interactions
test('handles click events', async () => {
  const handleClick = jest.fn()
  render(<Button onClick={handleClick}>Click me</Button>)
  
  await userEvent.click(screen.getByRole('button'))
  expect(handleClick).toHaveBeenCalled()
})
```

### Visual Regression Testing
- Storybook for component documentation
- Chromatic for visual testing
- Percy for screenshot comparisons

## Implementation Checklist

When creating new components, ensure:

- [ ] Follows design token system
- [ ] Responsive design (mobile-first)
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Type-safe with TypeScript
- [ ] Documented with Storybook
- [ ] Tested (unit + integration)
- [ ] Performance optimized
- [ ] Consistent with design patterns
- [ ] Supports dark mode
- [ ] Proper error handling

## Migration Guide

### From Basic to Enterprise Components

1. **Replace Card components**
```tsx
// Old
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
</Card>

// New
<Card variant="elevated" interactive>
  <CardHeader>
    <CardTitle size="base">Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
</Card>
```

2. **Upgrade Button usage**
```tsx
// Old
<Button>Save</Button>

// New
<Button 
  variant="gradient" 
  leftIcon={<Save className="h-4 w-4" />}
  loading={isSaving}
>
  Save Changes
</Button>
```

3. **Add Stats components**
```tsx
// Add overview metrics
<StatsGrid columns={4}>
  <StatsCard title="Total" value={stats.total} />
  <StatsCard title="Active" value={stats.active} />
  <StatsCard title="Revenue" value={formatCurrency(stats.revenue)} />
  <StatsCard title="Growth" value={`${stats.growth}%`} />
</StatsGrid>
```

This design system ensures consistency, maintainability, and scalability across the entire DesiCargo application while providing a premium user experience.