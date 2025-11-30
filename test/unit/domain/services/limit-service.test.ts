import { describe, it, expect } from '@jest/globals';
import { LimitService } from '../../../../src/domain/services/limit-service.js';
import type { DatasetSchema } from '../../../../src/domain/entities/dataset-schema.js';
import { FieldType } from '../../../../src/domain/value-objects/field-type.js';

describe('LimitService', () => {
  let service: LimitService;

  const mockSchema: DatasetSchema = {
    id: 'test-dataset',
    name: 'Test Dataset',
    description: 'A test dataset',
    fields: [
      { name: 'id', type: FieldType.Number, isKey: true, isLookupKey: false },
    ],
    keyField: 'id',
    lookupKeys: [],
    visibleFields: ['id'],
    limits: {
      defaultLimit: 10,
      maxLimit: 100,
    },
  };

  beforeEach(() => {
    service = new LimitService();
  });

  describe('computeEffectiveLimit', () => {
    it('should return defaultLimit when no limit is requested', () => {
      const result = service.computeEffectiveLimit(mockSchema);
      expect(result).toBe(10);
    });

    it('should return defaultLimit when requested limit is undefined', () => {
      const result = service.computeEffectiveLimit(mockSchema, undefined);
      expect(result).toBe(10);
    });

    it('should return defaultLimit when requested limit is null', () => {
      const result = service.computeEffectiveLimit(mockSchema, null as any);
      expect(result).toBe(10);
    });

    it('should return defaultLimit when requested limit is 0', () => {
      const result = service.computeEffectiveLimit(mockSchema, 0);
      expect(result).toBe(10);
    });

    it('should return defaultLimit when requested limit is negative', () => {
      const result = service.computeEffectiveLimit(mockSchema, -5);
      expect(result).toBe(10);
    });

    it('should return requested limit when it is less than maxLimit', () => {
      const result = service.computeEffectiveLimit(mockSchema, 50);
      expect(result).toBe(50);
    });

    it('should return requested limit when it equals maxLimit', () => {
      const result = service.computeEffectiveLimit(mockSchema, 100);
      expect(result).toBe(100);
    });

    it('should cap at maxLimit when requested limit exceeds it', () => {
      const result = service.computeEffectiveLimit(mockSchema, 200);
      expect(result).toBe(100);
    });

    it('should return 1 when requested limit is 1', () => {
      const result = service.computeEffectiveLimit(mockSchema, 1);
      expect(result).toBe(1);
    });

    it('should handle very large requested limits', () => {
      const result = service.computeEffectiveLimit(mockSchema, 1000000);
      expect(result).toBe(100);
    });
  });

  describe('wasTruncated', () => {
    it('should return true when total rows exceed limit', () => {
      const result = service.wasTruncated(100, 50);
      expect(result).toBe(true);
    });

    it('should return false when total rows equal limit', () => {
      const result = service.wasTruncated(50, 50);
      expect(result).toBe(false);
    });

    it('should return false when total rows are less than limit', () => {
      const result = service.wasTruncated(30, 50);
      expect(result).toBe(false);
    });

    it('should return false when there are zero rows', () => {
      const result = service.wasTruncated(0, 50);
      expect(result).toBe(false);
    });

    it('should return true when total rows exceed by 1', () => {
      const result = service.wasTruncated(51, 50);
      expect(result).toBe(true);
    });

    it('should handle large numbers correctly', () => {
      const result = service.wasTruncated(1000000, 100);
      expect(result).toBe(true);
    });
  });
});
