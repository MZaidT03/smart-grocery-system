// src/utils/mathUtils.js

export const sanitizeQuantity = (quantity, unit) => {
  if (!quantity) return 0;

  const val = parseFloat(quantity);
  const cleanUnit = (unit || "").toLowerCase().trim();

  // List of items that MUST be whole numbers (Integers)
  const discreteUnits = [
    "bottle",
    "bottles",
    "pkt",
    "packet",
    "packets",
    "pcs",
    "piece",
    "pieces",
    "can",
    "cans",
    "box",
    "boxes",
    "dozen",
    "dozens",
    "jar",
    "jars",
  ];

  if (discreteUnits.includes(cleanUnit)) {
    // 0.1 -> 1, 1.2 -> 2 (Always round UP)
    return Math.ceil(val);
  }

  // For kg, liters, etc., keep 2 decimals
  return parseFloat(val.toFixed(2));
};
