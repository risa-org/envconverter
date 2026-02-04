// parsers/kubernetes.js
// Parse and stringify Kubernetes ConfigMap format

import yaml from 'js-yaml';

export function parse(text) {
  try {
    const doc = yaml.load(text);
    
    if (!doc || typeof doc !== 'object') {
      throw new Error('Invalid YAML structure');
    }

    // Validate it's a ConfigMap
    if (doc.kind !== 'ConfigMap') {
      throw new Error('Not a valid Kubernetes ConfigMap (missing kind: ConfigMap)');
    }

    if (!doc.data || typeof doc.data !== 'object') {
      throw new Error('ConfigMap missing "data:" section');
    }

    const result = {};
    
    for (const [key, value] of Object.entries(doc.data)) {
      // Kubernetes ConfigMap keys should be DNS-safe
      if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(key)) {
        throw new Error(`Invalid ConfigMap key "${key}" - must be DNS-safe (lowercase, hyphens, dots)`);
      }
      result[key] = String(value);
    }

    return result;
  } catch (error) {
    throw new Error(`Kubernetes ConfigMap parse error: ${error.message}`);
  }
}

export function stringify(obj) {
  const data = {};
  
  // Sort keys for consistency
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    const value = obj[key];
    
    // Use literal block scalar (|) for multiline values
    if (value.includes('\n')) {
      data[key] = value;
    } else {
      data[key] = value;
    }
  }

  const configMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: 'app-config'
    },
    data
  };

  return yaml.dump(configMap, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    styles: {
      '!!str': 'literal' // Use | for multiline strings
    }
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