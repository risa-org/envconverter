// parsers/kubernetes.js
// Parse and stringify Kubernetes ConfigMap format

import yaml from 'js-yaml';

// Convert environment variable key to Kubernetes-safe key
function toKubernetesKey(envKey) {
  // Convert UPPERCASE_SNAKE_CASE to lowercase-kebab-case
  return envKey.toLowerCase().replace(/_/g, '-');
}

// Convert Kubernetes key back to environment variable format
function toEnvKey(k8sKey) {
  // Convert lowercase-kebab-case to UPPERCASE_SNAKE_CASE
  return k8sKey.toUpperCase().replace(/-/g, '_');
}

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
      // Convert Kubernetes keys back to env var format
      const envKey = toEnvKey(key);
      result[envKey] = String(value);
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
    
    // Convert env var keys to Kubernetes-safe format
    const k8sKey = toKubernetesKey(key);
    
    // Use literal block scalar (|) for multiline values
    if (value.includes('\n')) {
      data[k8sKey] = value;
    } else {
      data[k8sKey] = value;
    }
  }

  const configMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: 'app-config',
      namespace: 'default'
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