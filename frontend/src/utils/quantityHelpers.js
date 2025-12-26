/**
 * Quantity Helpers for Smart Grocery System
 * Place this file in: frontend/src/utils/quantityHelpers.js
 */

/**
 * Determines if a unit should only accept integer quantities
 */
export const isCountableUnit = (unit) => {
  const countable = [
    "packet",
    "pkt",
    "packets",
    "pieces",
    "piece",
    "pcs",
    "dozen",
    "doz",
    "box",
    "boxes",
    "bottle",
    "bottles",
    "jar",
    "jars",
    "roll",
    "rolls",
    "pack",
    "packs",
    "bunch",
    "bunches",
  ];

  return countable.includes(unit?.toLowerCase().trim());
};

/**
 * Normalizes quantity based on unit type
 */
export const normalizeQuantity = (value, unit) => {
  const num = parseFloat(value) || 0;

  if (isCountableUnit(unit)) {
    // Integer, minimum 1 for countable items
    return Math.max(1, Math.round(num));
  }

  // 2 decimal places, minimum 0.1 for measurable items
  return Math.max(0.1, Math.round(num * 100) / 100);
};

/**
 * Formats quantity for display (removes unnecessary decimals)
 */
export const formatQuantity = (qty, unit) => {
  if (qty === null || qty === undefined) return 0;

  if (isCountableUnit(unit)) {
    return Math.round(qty);
  }

  // For decimal units, remove trailing zeros
  const rounded = parseFloat(qty.toFixed(2));
  return rounded;
};

/**
 * Gets appropriate step value for input fields
 */
export const getQuantityStep = (unit) => {
  return isCountableUnit(unit) ? "1" : "0.1";
};

/**
 * Gets minimum allowed quantity for input fields
 */
export const getMinQuantity = (unit) => {
  return isCountableUnit(unit) ? "1" : "0.1";
};

/**
 * Validates quantity input
 */
export const validateQuantity = (value, unit) => {
  const num = parseFloat(value);

  if (isNaN(num) || num <= 0) {
    return { valid: false, message: "Quantity must be greater than 0" };
  }

  if (isCountableUnit(unit) && !Number.isInteger(num)) {
    return {
      valid: false,
      message: `${unit} must be a whole number`,
    };
  }

  return { valid: true, message: null };
};
