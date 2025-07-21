import { PlantData } from '../types/api';

// This interface should match the structure returned by openepi-client
export interface SoilProperties {
  phh2o: { "0-5cm": { mean: number; }, "5-15cm": { mean: number; } };
  soc: { "0-5cm": { mean: number; }, "5-15cm": { mean: number; } };
  // ... other properties
}

// Function to average soil values across relevant depths
const getAverageSoilValue = (property: any): number => {
  // Add logic to average values from "0-5cm", "5-15cm", etc.
  const values = Object.values(property).map((depth: any) => depth.mean);
  return values.reduce((a, b) => a + b, 0) / values.length;
};

export const analyzeCompliance = (soil: SoilProperties, plant: PlantData) => {
  // Add logic to compare soil.phh2o with plant.ph_min/ph_max
  const avgPh = getAverageSoilValue(soil.phh2o);
  const phCompliance = avgPh >= plant.ph_min && avgPh <= plant.ph_max;

  // Add logic to map soil.soc to fertility descriptions
  const avgSoc = getAverageSoilValue(soil.soc);
  let fertility = "unknown";
  if (avgSoc > 20) {
    fertility = "high";
  } else if (avgSoc > 10) {
    fertility = "medium";
  } else {
    fertility = "low";
  }

  // Handle missing data from either source gracefully.
  return {
    phCompliance,
    fertility,
  }
};
