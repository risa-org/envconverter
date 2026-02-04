// parsers/shell.js
// Parse and stringify Shell export format (bash/zsh)

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

    // Match: export KEY=value or export KEY="value"
    const exportMatch = line.match(/^export\s+([A-Z0-9_]+)=(.*)$/);
    if (!exportMatch) {
      errors.push(`Line ${lineNum}: Invalid export syntax. Expected: export KEY=value`);
      continue;
    }

    const key = exportMatch[1];
    let value = exportMatch[2];

    // Handle quoted values
    if (value.length >= 2) {
      const firstChar = value[0];
      const lastChar = value[value.length - 1];

      if ((firstChar === '"' && lastChar === '"') || 
          (firstChar === "'" && lastChar === "'")) {
        value = value.slice(1, -1);
        
        if (firstChar === '"') {
          // Unescape double-quoted strings
          value = value
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\\\$/g, '$');
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
      value.includes('$') ||
      value.includes('!') ||
      value.includes('&') ||
      value.includes('|') ||
      value.includes(';') ||
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
        .replace(/\$/g, '\\$')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      
      lines.push(`export ${key}="${escaped}"`);
    } else {
      lines.push(`export ${key}=${value}`);
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