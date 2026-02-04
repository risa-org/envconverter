// parsers/json.js
// Parse and stringify JSON format

export function parse(text) {
  try {
    const obj = JSON.parse(text);
    
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new Error('JSON must be a key-value object, not an array or primitive');
    }

    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Convert all values to strings
      if (typeof value === 'object' && value !== null) {
        throw new Error(`Value for key "${key}" is an object - only primitive values are supported`);
      }
      result[key] = String(value);
    }

    return result;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw new Error(`JSON parse error: ${error.message}`);
  }
}

export function stringify(obj) {
  // Sort keys for consistency
  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = obj[key];
  }

  return JSON.stringify(sorted, null, 2);
}

export function validate(text) {
  try {
    parse(text);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}