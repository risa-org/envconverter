// parsers/terraform.js
// Parse and stringify Terraform .tfvars format

export function parse(text) {
  const lines = text.split('\n');
  const result = {};
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    // Match: key = "value" or key = value
    const match = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*(.+)$/);
    if (!match) {
      // Skip if it looks like a variable block (for now)
      if (line.includes('variable')) continue;
      errors.push(`Line ${lineNum}: Invalid Terraform syntax. Expected: key = value`);
      continue;
    }

    const key = match[1];
    let value = match[2].trim();

    // Remove trailing comma if present
    if (value.endsWith(',')) {
      value = value.slice(0, -1).trim();
    }

    // Handle quoted strings
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
      // Unescape Terraform strings
      value = value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    } else if (value === 'true' || value === 'false') {
      // Keep boolean as string
      value = value;
    } else if (/^\d+$/.test(value)) {
      // Keep numbers as strings
      value = value;
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
    
    // Check if value is boolean-like
    if (value === 'true' || value === 'false') {
      lines.push(`${key} = ${value}`);
      continue;
    }

    // Check if value is number-like
    if (/^\d+$/.test(value)) {
      lines.push(`${key} = ${value}`);
      continue;
    }

    // Otherwise use quoted string
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    
    lines.push(`${key} = "${escaped}"`);
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