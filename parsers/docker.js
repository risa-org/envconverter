// parsers/docker.js
// Parse and stringify Docker Compose environment format

import yaml from 'js-yaml';

export function parse(text) {
  try {
    const doc = yaml.load(text);
    
    if (!doc || typeof doc !== 'object') {
      throw new Error('Invalid YAML structure');
    }

    // Look for environment key at various levels
    let envData = null;
    
    if (doc.environment) {
      envData = doc.environment;
    } else if (doc.services) {
      // Try to find first service with environment
      const services = Object.values(doc.services);
      for (const service of services) {
        if (service && service.environment) {
          envData = service.environment;
          break;
        }
      }
    }

    if (!envData) {
      throw new Error('No "environment:" section found in Docker Compose file');
    }

    const result = {};

    // Handle array format: ["KEY=value", "KEY2=value2"]
    if (Array.isArray(envData)) {
      for (const item of envData) {
        const equalIndex = item.indexOf('=');
        if (equalIndex === -1) {
          throw new Error(`Invalid environment entry: ${item}`);
        }
        const key = item.slice(0, equalIndex);
        const value = item.slice(equalIndex + 1);
        result[key] = value;
      }
    }
    // Handle object format: { KEY: value, KEY2: value2 }
    else if (typeof envData === 'object') {
      for (const [key, value] of Object.entries(envData)) {
        result[key] = String(value);
      }
    } else {
      throw new Error('Invalid environment format');
    }

    return result;
  } catch (error) {
    throw new Error(`Docker Compose parse error: ${error.message}`);
  }
}

export function stringify(obj) {
  const envObject = {};
  
  // Sort keys for consistency
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    envObject[key] = obj[key];
  }

  const dockerCompose = {
    version: '3.8',
    services: {
      app: {
        image: 'your-image:latest',
        environment: envObject
      }
    }
  };

  return yaml.dump(dockerCompose, {
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