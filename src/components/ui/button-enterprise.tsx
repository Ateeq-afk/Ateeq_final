// Re-export everything from the unified button component
export * from './button-unified'

// For backward compatibility, also export Button as default
import { Button as UnifiedButton } from './button-unified'
export { UnifiedButton as Button }