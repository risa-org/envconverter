// parsers/dotenv.js
// Parse and stringify .env format

export function parse(text) {
  const lines = text.split('\n');
  const result = {};
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Find the first = sign
    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) {
      errors.push(`Line ${lineNum}: Missing '=' separator`);
      continue;
    }

    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();

    // Validate key format (should be uppercase with underscores)
    if (!key) {
      errors.push(`Line ${lineNum}: Empty key name`);
      continue;
    }

    if (!/^[A-Z0-9_]+$/.test(key)) {
      errors.push(`Line ${lineNum}: Invalid key "${key}" - .env keys should use UPPERCASE_SNAKE_CASE`);
      continue;
    }

    // Handle quoted values
    if (value.length >= 2) {
      const firstChar = value[0];
      const lastChar = value[value.length - 1];

      if ((firstChar === '"' && lastChar === '"') || 
          (firstChar === "'" && lastChar === "'")) {
        // Remove quotes and unescape
        value = value.slice(1, -1);
        
        if (firstChar === '"') {
          // Unescape double-quoted strings
          value = value
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        }
      }
    }

    result[key] = value;
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return result;
}

export function stringify(obj) {
  const keys = Object.keys(obj).sort();
  const lines = [];

  for (const key of keys) {
    const value = obj[key];
    
    // Determine if we need quotes
    const needsQuotes = 
      value.includes(' ') ||
      value.includes('#') ||
      value.includes('\n') ||
      value.includes('\r') ||
      value.includes('\t') ||
      value.includes('"') ||
      value.includes("'") ||
      value === '';

    if (needsQuotes) {
      // Escape special characters for double quotes
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      
      lines.push(`${key}="${escaped}"`);
    } else {
      lines.push(`${key}=${value}`);
    }
  }

  return lines.join('\n');
}

export function validate(text) {
  try {
    parse(text);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}