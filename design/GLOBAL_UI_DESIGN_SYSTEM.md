# AI-GO Global UI/UX Design System

## 🎨 Design Philosophy

### Core Principles
1. **Universal Accessibility** - Design for all users, abilities, and cultures
2. **Performance First** - Every pixel must earn its bandwidth
3. **Cultural Neutrality** - Respectful of all cultures while maintaining brand identity
4. **Progressive Disclosure** - Simple by default, powerful when needed

## 🎭 Visual Identity

### Color System

```scss
// Primary Colors - Professional & Trustworthy
$primary-900: #0B1220;  // Deep space (primary background)
$primary-800: #0F172A;  // Dark slate
$primary-700: #1E293B;  // Slate
$primary-600: #334155;  // Medium slate
$primary-500: #475569;  // Light slate

// Accent Colors - Energy & Innovation
$accent-500: #06B6D4;   // Cyan (primary action)
$accent-400: #22D3EE;   // Light cyan
$accent-600: #0891B2;   // Dark cyan

// Semantic Colors - Universal Understanding
$success-500: #10B981;  // Green (operational)
$warning-500: #F59E0B;  // Amber (degraded)
$error-500: #EF4444;    // Red (outage)
$info-500: #3B82F6;     // Blue (information)

// Neutral Grays - Accessibility
$gray-50: #F9FAFB;
$gray-100: #F3F4F6;
$gray-200: #E5E7EB;
$gray-300: #D1D5DB;
$gray-400: #9CA3AF;
$gray-500: #6B7280;
$gray-600: #4B5563;
$gray-700: #374151;
$gray-800: #1F2937;
$gray-900: #111827;

// Regional Color Adaptations
$colors-regional: (
  'cn': (
    'lucky': #DC2626,     // Red for prosperity
    'premium': #F59E0B    // Gold for premium
  ),
  'jp': (
    'seasonal': #EC4899,  // Sakura pink
    'trust': #1E40AF      // Deep blue
  )
);
```

### Typography System

```scss
// Font Stack - Performance & Compatibility
$font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
            'Noto Sans', 'Helvetica Neue', Arial, sans-serif;

$font-mono: 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace;

// CJK Font Support
$font-cjk: 'Noto Sans CJK', 'Microsoft YaHei', 'Hiragino Sans', 'Apple SD Gothic Neo';

// Arabic Support
$font-arabic: 'Noto Sans Arabic', 'Segoe UI', Tahoma;

// Type Scale - Responsive & Accessible
$type-scale: (
  'xs': (
    'size': 0.75rem,    // 12px
    'line': 1rem,       // 16px
    'tracking': 0.05em
  ),
  'sm': (
    'size': 0.875rem,   // 14px
    'line': 1.25rem,    // 20px
    'tracking': 0.025em
  ),
  'base': (
    'size': 1rem,       // 16px
    'line': 1.5rem,     // 24px
    'tracking': 0
  ),
  'lg': (
    'size': 1.125rem,   // 18px
    'line': 1.75rem,    // 28px
    'tracking': -0.025em
  ),
  'xl': (
    'size': 1.25rem,    // 20px
    'line': 1.75rem,    // 28px
    'tracking': -0.025em
  ),
  '2xl': (
    'size': 1.5rem,     // 24px
    'line': 2rem,       // 32px
    'tracking': -0.025em
  ),
  '3xl': (
    'size': 1.875rem,   // 30px
    'line': 2.25rem,    // 36px
    'tracking': -0.025em
  ),
  '4xl': (
    'size': 2.25rem,    // 36px
    'line': 2.5rem,     // 40px
    'tracking': -0.05em
  )
);
```

### Spacing System

```scss
// 8-point Grid System
$spacing: (
  '0': 0,
  '1': 0.25rem,   // 4px
  '2': 0.5rem,    // 8px
  '3': 0.75rem,   // 12px
  '4': 1rem,      // 16px
  '5': 1.25rem,   // 20px
  '6': 1.5rem,    // 24px
  '8': 2rem,      // 32px
  '10': 2.5rem,   // 40px
  '12': 3rem,     // 48px
  '16': 4rem,     // 64px
  '20': 5rem,     // 80px
  '24': 6rem,     // 96px
);
```

## 🧩 Component Library

### Button System

```tsx
// Global Button Component with Regional Adaptations
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  locale?: string;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  locale = 'en-US',
  children,
  ...props
}) => {
  const styles = {
    primary: 'bg-accent-500 hover:bg-accent-600 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-100',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-300',
    danger: 'bg-error-500 hover:bg-error-600 text-white'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  // Regional adjustments
  const regionalStyles = {
    'zh-CN': size === 'sm' ? 'py-2' : '', // Larger touch targets for CN
    'ja-JP': 'font-medium',                // Lighter font weight for JP
  };
  
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-accent-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        styles[variant],
        sizes[size],
        regionalStyles[locale] || '',
        props.fullWidth && 'w-full'
      )}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Card Component

```tsx
// Adaptive Card Component
export const Card: React.FC<CardProps> = ({
  elevated = false,
  interactive = false,
  locale,
  children,
  ...props
}) => {
  const baseStyles = cn(
    'rounded-xl border transition-all duration-200',
    'bg-gray-800 border-gray-700',
    elevated && 'shadow-xl shadow-black/20',
    interactive && 'hover:border-gray-600 cursor-pointer'
  );
  
  // RTL support
  const directionStyles = locale && ['ar-SA', 'he-IL'].includes(locale) 
    ? 'dir-rtl text-right' 
    : '';
  
  return (
    <div className={cn(baseStyles, directionStyles)} {...props}>
      {children}
    </div>
  );
};
```

### Status Indicators

```tsx
// Universal Status Component
export const StatusIndicator: React.FC<{
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  locale?: string;
}> = ({ status, size = 'md', showLabel = false, locale = 'en-US' }) => {
  const colors = {
    operational: 'bg-success-500',
    degraded: 'bg-warning-500',
    outage: 'bg-error-500',
    maintenance: 'bg-info-500'
  };
  
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  const labels = {
    'en-US': {
      operational: 'Operational',
      degraded: 'Degraded',
      outage: 'Outage',
      maintenance: 'Maintenance'
    },
    'zh-CN': {
      operational: '正常运行',
      degraded: '性能下降',
      outage: '服务中断',
      maintenance: '维护中'
    },
    'ja-JP': {
      operational: '稼働中',
      degraded: '劣化',
      outage: '停止',
      maintenance: 'メンテナンス'
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'rounded-full animate-pulse',
        colors[status],
        sizes[size]
      )} />
      {showLabel && (
        <span className="text-sm text-gray-300">
          {labels[locale]?.[status] || labels['en-US'][status]}
        </span>
      )}
    </div>
  );
};
```

## 📊 Data Visualization

### Chart Color Schemes

```typescript
// Culturally Neutral Chart Colors
export const chartColors = {
  primary: ['#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'],
  
  // Colorblind-safe palette
  accessible: ['#0173B2', '#DE8F05', '#029E73', '#CC78BC', '#CA9161'],
  
  // Regional preferences
  regional: {
    'zh-CN': ['#DC2626', '#F59E0B', '#059669', '#3B82F6', '#7C3AED'],
    'ja-JP': ['#1E40AF', '#059669', '#DC2626', '#7C3AED', '#F59E0B']
  },
  
  // Semantic colors for status
  status: {
    good: '#10B981',
    warning: '#F59E0B',
    bad: '#EF4444',
    neutral: '#6B7280'
  }
};
```

### Responsive Chart Configurations

```typescript
// Chart Responsive Breakpoints
export const chartConfig = {
  mobile: {
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    fontSize: 10,
    strokeWidth: 1.5
  },
  tablet: {
    margin: { top: 30, right: 30, bottom: 50, left: 50 },
    fontSize: 12,
    strokeWidth: 2
  },
  desktop: {
    margin: { top: 40, right: 40, bottom: 60, left: 60 },
    fontSize: 14,
    strokeWidth: 2.5
  }
};
```

## 🌐 Internationalization Components

### Language Switcher

```tsx
export const LanguageSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { locale, setLocale } = useI18n();
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700"
      >
        <span className="text-lg">{SUPPORTED_LOCALES[locale].flag}</span>
        <span className="text-sm">{SUPPORTED_LOCALES[locale].name}</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2">
          {Object.entries(SUPPORTED_LOCALES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => {
                setLocale(key);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-3"
            >
              <span className="text-lg">{value.flag}</span>
              <span className="text-sm">{value.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Number & Currency Formatting

```tsx
export const FormattedNumber: React.FC<{
  value: number;
  locale: string;
  style?: 'decimal' | 'percent' | 'currency';
  currency?: string;
}> = ({ value, locale, style = 'decimal', currency = 'USD' }) => {
  const formatted = new Intl.NumberFormat(locale, {
    style,
    currency: style === 'currency' ? currency : undefined,
    minimumFractionDigits: style === 'percent' ? 1 : 0,
    maximumFractionDigits: style === 'percent' ? 1 : 2
  }).format(value);
  
  return <span>{formatted}</span>;
};
```

## 📱 Responsive Design System

### Breakpoint System

```scss
$breakpoints: (
  'xs': 475px,    // Mobile S
  'sm': 640px,    // Mobile L
  'md': 768px,    // Tablet
  'lg': 1024px,   // Desktop
  'xl': 1280px,   // Desktop L
  '2xl': 1536px  // Desktop XL
);

// Mobile-first responsive utilities
@mixin responsive($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}
```

### Grid System

```tsx
// Responsive Grid Component
export const Grid: React.FC<{
  cols?: { xs?: number; sm?: number; md?: number; lg?: number };
  gap?: number;
  children: React.ReactNode;
}> = ({ cols = {}, gap = 4, children }) => {
  const colClasses = cn(
    'grid',
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    `gap-${gap}`
  );
  
  return <div className={colClasses}>{children}</div>;
};
```

## ♿ Accessibility Guidelines

### ARIA Patterns

```tsx
// Accessible Modal Component
export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title,
  children 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Trap focus within modal
  useFocusTrap(modalRef, isOpen);
  
  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-gray-800 rounded-xl p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-xl font-semibold mb-4">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};
```

### Keyboard Navigation

```typescript
// Keyboard navigation hooks
export const useKeyboardNavigation = (items: any[]) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
    }
  };
  
  return { focusedIndex, handleKeyDown };
};
```

## 🎯 Motion & Animation

### Animation Principles

```scss
// Performance-conscious animations
$transition-base: 200ms ease-out;
$transition-slow: 300ms ease-out;
$transition-slower: 500ms ease-out;

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

// Common animations
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 🌙 Dark/Light Theme Support

```typescript
// Theme configuration
export const themes = {
  dark: {
    background: {
      primary: '#0B1220',
      secondary: '#0F172A',
      tertiary: '#1E293B'
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF'
    },
    border: '#374151'
  },
  
  light: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F3F4F6'
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
      tertiary: '#6B7280'
    },
    border: '#E5E7EB'
  }
};

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // Detect system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');
    
    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
```

## 📐 Layout Components

### Global Layout Structure

```tsx
export const GlobalLayout: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { locale } = useI18n();
  const isRTL = ['ar-SA', 'he-IL', 'fa-IR'].includes(locale);
  
  return (
    <div className={cn('min-h-screen', isRTL && 'rtl')}>
      {/* Global Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <Navigation />
            <div className="flex items-center gap-4">
              <RegionSelector />
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Global Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <FooterLinks />
            <RegionalCompliance />
            <SocialLinks />
            <Newsletter />
          </div>
        </div>
      </footer>
    </div>
  );
};
```

## 🎛️ Form Components

### Input System

```tsx
export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  locale,
  ...props
}) => {
  const inputId = useId();
  const isRTL = ['ar-SA', 'he-IL'].includes(locale || '');
  
  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-300"
        >
          {label}
        </label>
      )}
      
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-2 rounded-lg',
          'bg-gray-800 border border-gray-700',
          'text-gray-100 placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-accent-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-error-500 focus:ring-error-500',
          isRTL && 'text-right'
        )}
        {...props}
      />
      
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
      
      {error && (
        <p className="text-sm text-error-500">{error}</p>
      )}
    </div>
  );
};
```

## 🔔 Notification System

```tsx
export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const icons = {
    success: <CheckCircleIcon className="w-5 h-5" />,
    error: <XCircleIcon className="w-5 h-5" />,
    warning: <ExclamationIcon className="w-5 h-5" />,
    info: <InformationCircleIcon className="w-5 h-5" />
  };
  
  const colors = {
    success: 'bg-success-500/10 border-success-500 text-success-500',
    error: 'bg-error-500/10 border-error-500 text-error-500',
    warning: 'bg-warning-500/10 border-warning-500 text-warning-500',
    info: 'bg-info-500/10 border-info-500 text-info-500'
  };
  
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-lg border',
      'animate-slideIn',
      colors[type]
    )}>
      {icons[type]}
      <div className="flex-1">
        <h4 className="font-medium">{title}</h4>
        {message && <p className="text-sm mt-1 opacity-80">{message}</p>}
      </div>
      <button
        onClick={onClose}
        className="opacity-60 hover:opacity-100 transition-opacity"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
```

## 📋 Implementation Checklist

### Phase 1: Foundation
- [ ] Set up design tokens (colors, typography, spacing)
- [ ] Create base component library
- [ ] Implement responsive grid system
- [ ] Set up theme provider

### Phase 2: Components
- [ ] Build form components
- [ ] Create data display components
- [ ] Implement navigation components
- [ ] Add feedback components

### Phase 3: Internationalization
- [ ] Add RTL support
- [ ] Implement locale-specific components
- [ ] Create translation system
- [ ] Add regional adaptations

### Phase 4: Optimization
- [ ] Implement lazy loading
- [ ] Add animation system
- [ ] Optimize for performance
- [ ] Ensure accessibility compliance

### Phase 5: Documentation
- [ ] Create component documentation
- [ ] Build interactive styleguide
- [ ] Write usage guidelines
- [ ] Create regional customization guide