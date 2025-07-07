import { Response } from 'express';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendServerError,
  sendDatabaseError
} from '../../../src/utils/apiResponse';

// Mock response object
const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    req: {
      originalUrl: '/test-endpoint'
    }
  } as unknown as Response;
  
  return res;
};

describe('API Response Utils', () => {
  let mockRes: Response;

  beforeEach(() => {
    mockRes = createMockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSuccess', () => {
    it('should send success response with data', () => {
      const testData = { id: 1, name: 'Test' };
      const message = 'Success message';

      sendSuccess(mockRes, testData, message);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
        message,
        timestamp: expect.any(String),
        path: '/test-endpoint'
      });
    });

    it('should send success response with custom status code', () => {
      const testData = { created: true };
      
      sendSuccess(mockRes, testData, 'Created', 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
        message: 'Created',
        timestamp: expect.any(String),
        path: '/test-endpoint'
      });
    });

    it('should send success response without data', () => {
      sendSuccess(mockRes, undefined, 'Operation completed');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: undefined,
        message: 'Operation completed',
        timestamp: expect.any(String),
        path: '/test-endpoint'
      });
    });
  });

  describe('sendError', () => {
    it('should send error response with details', () => {
      const error = 'Something went wrong';
      const details = { field: 'validation failed' };

      sendError(mockRes, error, 400, details, 'Custom message');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error,
        message: 'Custom message',
        details,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        statusCode: 400
      });
    });

    it('should send error response without details', () => {
      const error = 'Not found';

      sendError(mockRes, error, 404);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error,
        message: undefined,
        details: undefined,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        statusCode: 404
      });
    });
  });

  describe('sendValidationError', () => {
    it('should send validation error with proper format', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' }
      ];

      sendValidationError(mockRes, validationErrors);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation Error',
        message: 'Validation failed',
        details: validationErrors,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        statusCode: 400
      });
    });

    it('should send validation error with custom message', () => {
      const validationErrors = [{ field: 'name', message: 'Required' }];
      const customMessage = 'Form validation failed';

      sendValidationError(mockRes, validationErrors, customMessage);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation Error',
          message: customMessage,
          details: validationErrors
        })
      );
    });
  });

  describe('sendNotFound', () => {
    it('should send not found error with default resource', () => {
      sendNotFound(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Resource not found',
          statusCode: 404
        })
      );
    });

    it('should send not found error with custom resource', () => {
      sendNotFound(mockRes, 'User');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not found',
          statusCode: 404
        })
      );
    });
  });

  describe('sendUnauthorized', () => {
    it('should send unauthorized error with default message', () => {
      sendUnauthorized(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Unauthorized',
          message: 'Unauthorized access',
          statusCode: 401
        })
      );
    });

    it('should send unauthorized error with custom message', () => {
      const customMessage = 'Invalid token';

      sendUnauthorized(mockRes, customMessage);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Unauthorized',
          message: customMessage,
          statusCode: 401
        })
      );
    });
  });

  describe('sendForbidden', () => {
    it('should send forbidden error with default message', () => {
      sendForbidden(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Forbidden',
          message: 'Access forbidden',
          statusCode: 403
        })
      );
    });

    it('should send forbidden error with custom message', () => {
      const customMessage = 'Insufficient permissions';

      sendForbidden(mockRes, customMessage);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Forbidden',
          message: customMessage,
          statusCode: 403
        })
      );
    });
  });

  describe('sendServerError', () => {
    it('should send server error with development details', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Database connection failed');
      const customMessage = 'Database error';

      sendServerError(mockRes, error, customMessage);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Server Error',
          message: customMessage,
          details: error,
          statusCode: 500
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should send server error without details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Database connection failed');

      sendServerError(mockRes, error);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Server Error',
          message: 'Internal server error',
          details: undefined,
          statusCode: 500
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('sendDatabaseError', () => {
    it('should handle PGRST116 error as not found', () => {
      const error = { code: 'PGRST116', message: 'No rows found' };

      sendDatabaseError(mockRes, error, 'Find user');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Record not found',
          statusCode: 404
        })
      );
    });

    it('should handle 23505 error as duplicate entry', () => {
      const error = { code: '23505', message: 'Duplicate key violation' };

      sendDatabaseError(mockRes, error, 'Create user');

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Duplicate entry',
          message: 'A record with this information already exists',
          statusCode: 409
        })
      );
    });

    it('should handle 23503 error as foreign key constraint', () => {
      const error = { code: '23503', message: 'Foreign key violation' };

      sendDatabaseError(mockRes, error, 'Delete organization');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Foreign key constraint',
          message: 'Referenced record does not exist',
          statusCode: 400
        })
      );
    });

    it('should handle unknown database error as server error', () => {
      const error = { code: 'UNKNOWN', message: 'Unknown database error' };

      sendDatabaseError(mockRes, error, 'Update booking');

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Server Error',
          message: 'Update booking failed',
          statusCode: 500
        })
      );
    });
  });

  describe('Response format validation', () => {
    it('should include proper timestamp format', () => {
      sendSuccess(mockRes, { test: true });

      const callArgs = (mockRes.json as jest.Mock).mock.calls[0][0];
      const timestamp = callArgs.timestamp;
      
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp)).toBeValidDate();
    });

    it('should include request path when available', () => {
      sendError(mockRes, 'Test error', 400);

      const callArgs = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.path).toBe('/test-endpoint');
    });

    it('should handle missing request path gracefully', () => {
      const resWithoutReq = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        req: {}
      } as unknown as Response;

      sendSuccess(resWithoutReq, { test: true });

      const callArgs = (resWithoutReq.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.path).toBeUndefined();
    });
  });
});