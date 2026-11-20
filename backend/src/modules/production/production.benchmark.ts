/**
 * Bill of Materials (BOM) & Production Benchmark Store
 * Order-to-Audit Manufacturing ERP
 * 
 * Standard BOM Formula for Traditional Crunchy Murukku 200 g:
 * - Expected batch output: 200 packets
 * - Flour: 40 kg
 * - Oil: 10 litres
 * - Spice mix: 1.2 kg
 * - Pouches: 200 pieces
 * - Cartons: 10 pieces
 */

import { BillOfMaterialDTO, ProductionRunDTO } from './production.types';

export const BENCHMARK_MURUKKU_BOM: BillOfMaterialDTO = {
  id: 'bom-mur-200g-v1',
  bomNumber: 'BOM-MUR-200G-V1.0',
  productId: 'inv-fg-mur-200g',
  productCode: 'PRD-MUR-200G',
  productName: 'Traditional Crunchy Murukku 200g',
  version: 'V1.0',
  batchSize: 200,
  batchUnit: 'PKT',
  expectedOutput: 200,
  status: 'ACTIVE',
  effectiveDate: '2026-11-20T00:00:00.000Z',
  items: [
    {
      id: 'bomi-flour-01',
      itemType: 'RAW_MATERIAL',
      materialId: 'inv-rm-rice-01',
      materialCode: 'RM-RICE-01',
      materialName: 'Raw Rice Flour (Grade A - Mesh 80)',
      standardQty: 40.0, // 40 kg flour for 200 packets
      unitCode: 'KG',
      expectedWastagePct: 1.0,
      unitCost: 43.125, // prevailing weighted average cost
      lineCost: 1725.0, // 40 * 43.125
    },
    {
      id: 'bomi-oil-02',
      itemType: 'RAW_MATERIAL',
      materialId: 'inv-rm-oil-01',
      materialCode: 'RM-OIL-01',
      materialName: 'Refined Sunflower Cooking Oil',
      standardQty: 10.0, // 10 litres oil for 200 packets
      unitCode: 'LTR',
      expectedWastagePct: 0.0,
      unitCost: 125.0,
      lineCost: 1250.0, // 10 * 125.0
    },
    {
      id: 'bomi-spice-03',
      itemType: 'RAW_MATERIAL',
      materialId: 'inv-rm-spice-01',
      materialCode: 'RM-SPICE-01',
      materialName: 'Murukku Special Spice Mix (Cumin, Sesame, Asafoetida)',
      standardQty: 1.2, // 1.2 kg for 200 packets
      unitCode: 'KG',
      expectedWastagePct: 0.5,
      unitCost: 240.0,
      lineCost: 288.0, // 1.2 * 240.0
    },
    {
      id: 'bomi-pouch-04',
      itemType: 'PACKAGING_MATERIAL',
      materialId: 'inv-pm-pouch-01',
      materialCode: 'PM-POUCH-MUR-200',
      materialName: 'Murukku 200g 3-Ply Nitrogen Barrier Pouch',
      standardQty: 200.0, // 200 pouches for 200 packets
      unitCode: 'PCS',
      expectedWastagePct: 1.0,
      unitCost: 2.25,
      lineCost: 450.0, // 200 * 2.25
    },
    {
      id: 'bomi-ctn-05',
      itemType: 'PACKAGING_MATERIAL',
      materialId: 'inv-pm-ctn-01',
      materialCode: 'PM-CTN-MUR-50',
      materialName: '5-Ply Corrugated Master Carton (50 x 200g Pkts)',
      standardQty: 10.0, // 10 cartons
      unitCode: 'PCS',
      expectedWastagePct: 0.0,
      unitCost: 38.5,
      lineCost: 385.0, // 10 * 38.5
    },
  ],
  totalRawMaterialCost: 3263.0, // 1725 + 1250 + 288
  totalPackagingCost: 835.0, // 450 + 385
  totalBatchCost: 4098.0, // 3263 + 835
  costPerUnitOutput: 20.49, // 4098 / 200
  notes: 'Standard industrial batch formula for Murukku 200g packaging line',
  createdAt: '2026-11-20T00:00:00.000Z',
  updatedAt: '2026-11-20T00:00:00.000Z',
};

export const INITIAL_PRODUCTION_RUNS: ProductionRunDTO[] = [];
