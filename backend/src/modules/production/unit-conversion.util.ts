/**
 * Production Unit Conversion Utility
 * Order-to-Audit Manufacturing ERP
 * 
 * Supports high-precision conversions across weight, volume, and packaging units:
 * - KG <-> G
 * - LTR <-> ML
 * - PCS <-> PKT <-> CTN
 */

import { BadRequestError } from '../../utils/appError';

export interface ConversionFactor {
  fromUnit: string;
  toUnit: string;
  multiplier: number;
}

const STANDARD_CONVERSIONS: Record<string, Record<string, number>> = {
  // Weight conversions
  KG: {
    KG: 1,
    G: 1000,
  },
  G: {
    G: 1,
    KG: 0.001,
  },

  // Volume conversions
  LTR: {
    LTR: 1,
    ML: 1000,
  },
  ML: {
    ML: 1,
    LTR: 0.001,
  },

  // Packaging conversions
  CTN: {
    CTN: 1,
    PKT: 20, // Default 1 master carton = 20 packets (or 50 packets for large cartons)
    PCS: 20,
  },
  PKT: {
    PKT: 1,
    PCS: 1,
    CTN: 1 / 20,
  },
  PCS: {
    PCS: 1,
    PKT: 1,
    CTN: 1 / 20,
  },
};

export class UnitConversionUtil {
  /**
   * Convert quantity from fromUnit to toUnit
   */
  static convert(
    quantity: number,
    fromUnit: string,
    toUnit: string,
    customMultiplier?: number
  ): number {
    const from = fromUnit.trim().toUpperCase();
    const to = toUnit.trim().toUpperCase();

    if (from === to) {
      return quantity;
    }

    if (customMultiplier && customMultiplier > 0) {
      return Number((quantity * customMultiplier).toFixed(6));
    }

    const fromMap = STANDARD_CONVERSIONS[from];
    if (fromMap && fromMap[to] !== undefined) {
      return Number((quantity * fromMap[to]).toFixed(6));
    }

    throw new BadRequestError(
      `Unsupported unit conversion: Cannot convert from '${fromUnit}' to '${toUnit}'. Compatible units are KG<->G, LTR<->ML, CTN<->PKT<->PCS.`
    );
  }

  /**
   * Check if two units are compatible
   */
  static areCompatible(unitA: string, unitB: string): boolean {
    const a = unitA.trim().toUpperCase();
    const b = unitB.trim().toUpperCase();
    if (a === b) return true;
    return !!(STANDARD_CONVERSIONS[a] && STANDARD_CONVERSIONS[a][b] !== undefined);
  }

  /**
   * Get standard base unit for an inventory unit code
   */
  static getBaseUnit(unitCode: string): string {
    const u = unitCode.trim().toUpperCase();
    if (u === 'G' || u === 'KG') return 'KG';
    if (u === 'ML' || u === 'LTR') return 'LTR';
    if (u === 'PKT' || u === 'PCS' || u === 'CTN') return 'PKT';
    return unitCode;
  }
}
