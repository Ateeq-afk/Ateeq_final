import { generateLRNumber } from '../../../src/utils/lrGenerator';
import { supabase } from '../../../src/supabaseClient';

// Mock the Supabase client
jest.mock('../../../src/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

describe('generateLRNumber', () => {
  const mockBranchId = 'test-branch-123';
  const mockDate = new Date('2024-01-15');
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return a string', async () => {
    // Mock branch data
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              name: 'Karur to Kodakara',
              organizations: {
                organization_codes: [{ code: 'K2K' }]
              }
            },
            error: null
          })
        })
      })
    });

    // Mock latest LR query
    const mockBookingsFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        ilike: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      })
    });

    // Setup mocks
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'branches') return mockFrom();
      if (table === 'bookings') return mockBookingsFrom();
      return null;
    });

    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: true,
      error: null
    });

    // Execute
    const result = await generateLRNumber(mockBranchId);

    // Assert
    expect(typeof result).toBe('string');
  });

  it('should start with the correct prefix (K2K)', async () => {
    // Mock branch data with K2K organization code
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              name: 'Karur to Kodakara',
              organizations: {
                organization_codes: [{ code: 'K2K' }]
              }
            },
            error: null
          })
        })
      })
    });

    // Mock latest LR query
    const mockBookingsFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        ilike: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      })
    });

    // Setup mocks
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'branches') return mockFrom();
      if (table === 'bookings') return mockBookingsFrom();
      return null;
    });

    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: true,
      error: null
    });

    // Execute
    const result = await generateLRNumber(mockBranchId);

    // Assert - should start with branch prefix (KAR), org code (K2K), and year (2024)
    expect(result).toMatch(/^KAR-K2K-2024-/);
  });

  it('should have the expected length', async () => {
    // Mock branch data
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              name: 'Karur to Kodakara',
              organizations: {
                organization_codes: [{ code: 'K2K' }]
              }
            },
            error: null
          })
        })
      })
    });

    // Mock latest LR query
    const mockBookingsFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        ilike: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ lr_number: 'KAR-K2K-2024-00042' }],
              error: null
            })
          })
        })
      })
    });

    // Setup mocks
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'branches') return mockFrom();
      if (table === 'bookings') return mockBookingsFrom();
      return null;
    });

    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: true,
      error: null
    });

    // Execute
    const result = await generateLRNumber(mockBranchId);

    // Assert - format should be PREFIX-ORGCODE-YEAR-SEQUENCE
    // Example: KAR-K2K-2024-00043
    expect(result).toHaveLength(18); // 3 + 1 + 3 + 1 + 4 + 1 + 5 = 18
    expect(result).toMatch(/^[A-Z]{3}-[A-Z0-9]{3}-\d{4}-\d{5}$/);
  });
});