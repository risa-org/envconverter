// parsers/yaml.js
// Parse and stringify simple YAML key-value format

import yaml from 'js-yaml';

export function parse(text) {
  try {
    const obj = yaml.load(text);
    
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new Error('YAML must be a key-value object, not an array or primitive');
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
    throw new Error(`YAML parse error: ${error.message}`);
  }
}

export function stringify(obj) {
  // Sort keys for consistency
  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = obj[key];
  }

  return yaml.dump(sorted, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  });
}

export function validate(text) {
  try {
    parse(text);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}