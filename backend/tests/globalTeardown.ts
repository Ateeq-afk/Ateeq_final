export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Run all registered cleanup functions
    if (global.__CLEANUP_FUNCTIONS__ && Array.isArray(global.__CLEANUP_FUNCTIONS__)) {
      for (const cleanup of global.__CLEANUP_FUNCTIONS__) {
        try {
          await cleanup();
        } catch (error) {
          console.warn('⚠️ Cleanup function failed:', error);
        }
      }
    }
    
    // Clear any remaining timers or handles
    if (global.__SERVER_INSTANCE__) {
      global.__SERVER_INSTANCE__.close();
    }
    
  } catch (error) {
    console.warn('⚠️ Global teardown error:', error);
  }
  
  console.log('🧹 Test environment cleanup complete');
}