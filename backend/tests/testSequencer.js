const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Define test order priority
    const testOrder = [
      'unit',      // Unit tests first
      'helpers',   // Helper function tests
      'integration', // Integration tests
      'e2e'        // E2E tests last
    ];
    
    return tests.sort((testA, testB) => {
      // Get test type from path
      const getTestType = (path) => {
        for (const type of testOrder) {
          if (path.includes(`/${type}/`)) return type;
        }
        return 'unit'; // Default to unit test priority
      };
      
      const typeA = getTestType(testA.path);
      const typeB = getTestType(testB.path);
      
      const priorityA = testOrder.indexOf(typeA);
      const priorityB = testOrder.indexOf(typeB);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Within same type, sort alphabetically
      return testA.path.localeCompare(testB.path);
    });
  }
}

module.exports = CustomSequencer;