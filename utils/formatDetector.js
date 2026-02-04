// utils/formatDetector.js
// Auto-detect input format from text content

export function detectFormat(text) {
  const trimmed = text.trim();
  
  if (!trimmed) {
    return null;
  }

  // Check for Kubernetes ConfigMap
  if (/apiVersion:\s*v1/.test(trimmed) && /kind:\s*ConfigMap/.test(trimmed)) {
    return 'kubernetes';
  }

  // Check for Docker Compose
  if (/version:\s*['"]?\d/.test(trimmed) && /services:/.test(trimmed)) {
    return 'docker';
  }

  // Check for JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, continue checking
    }
  }

  // Check for YAML (simple key-value)
  if (/^[a-zA-Z0-9_-]+:\s*.+$/m.test(trimmed) && !trimmed.includes('=')) {
    // Make sure it's not Kubernetes or Docker (already checked above)
    if (!trimmed.includes('apiVersion') && !trimmed.includes('services:')) {
      return 'yaml';
    }
  }

  // Check for Shell exports
  if (/^export\s+[A-Z0-9_]+=/.test(trimmed)) {
    return 'shell';
  }

  // Check for Terraform .tfvars
  if (/^[a-zA-Z0-9_-]+\s*=\s*/.test(trimmed) && !trimmed.includes('export')) {
    // Could be Terraform or .env - check for Terraform-specific patterns
    if (trimmed.includes('variable') || /=\s*(true|false)\s*$/m.test(trimmed)) {
      return 'terraform';
    }
  }

  // Check for .env format (default fallback for KEY=value)
  if (/^[A-Z0-9_]+=/.test(trimmed)) {
    return 'dotenv';
  }

  // If nothing matched, try to guess from structure
  const lines = trimmed.split('\n').filter(line => {
    const l = line.trim();
    return l && !l.startsWith('#') && !l.startsWith('//');
  });

  if (lines.length > 0) {
    const firstLine = lines[0];
    
    // Has equals sign - likely .env or Terraform
    if (firstLine.includes('=')) {
      // Check if it's all uppercase (likely .env)
      if (/^[A-Z0-9_]+=/.test(firstLine)) {
        return 'dotenv';
      }
      // Mixed case with spaces around = (likely Terraform)
      if (/\s=\s/.test(firstLine)) {
        return 'terraform';
      }
      return 'dotenv'; // Default to .env
    }
    
    // Has colon - likely YAML or Kubernetes/Docker
    if (firstLine.includes(':')) {
      return 'yaml';
    }
  }

  // Unable to detect - return null
  return null;
}

export function getFormatConfidence(text, detectedFormat) {
  if (!detectedFormat) {
    return 0;
  }

  let confidence = 0;
  const trimmed = text.trim();

  switch (detectedFormat) {
    case 'kubernetes':
      if (trimmed.includes('apiVersion')) confidence += 40;
      if (trimmed.includes('kind: ConfigMap')) confidence += 40;
      if (trimmed.includes('metadata:')) confidence += 10;
      if (trimmed.includes('data:')) confidence += 10;
      break;

    case 'docker':
      if (/version:\s*['"]?\d/.test(trimmed)) confidence += 30;
      if (trimmed.includes('services:')) confidence += 40;
      if (trimmed.includes('environment:')) confidence += 20;
      if (trimmed.includes('image:')) confidence += 10;
      break;

    case 'json':
      try {
        JSON.parse(trimmed);
        confidence = 100;
      } catch {
        confidence = 0;
      }
      break;

    case 'shell':
      const exportLines = trimmed.split('\n').filter(l => l.trim().startsWith('export'));
      const totalLines = trimmed.split('\n').filter(l => l.trim()).length;
      confidence = Math.min(100, (exportLines.length / totalLines) * 100);
      break;

    case 'terraform':
      if (trimmed.includes('variable')) confidence += 30;
      if (/=\s*(true|false)/.test(trimmed)) confidence += 30;
      if (/\s=\s/.test(trimmed)) confidence += 20;
      if (trimmed.includes('//')) confidence += 20;
      break;

    case 'dotenv':
      const envLines = trimmed.split('\n').filter(l => /^[A-Z0-9_]+=/.test(l.trim()));
      const total = trimmed.split('\n').filter(l => l.trim()).length;
      confidence = Math.min(100, (envLines.length / total) * 100);
      break;

    case 'yaml':
      const yamlLines = trimmed.split('\n').filter(l => /^[a-zA-Z0-9_-]+:/.test(l.trim()));
      const totalYaml = trimmed.split('\n').filter(l => l.trim()).length;
      confidence = Math.min(100, (yamlLines.length / totalYaml) * 100);
      break;
  }

  return Math.min(100, Math.max(0, confidence));
}

export function suggestFormat(text) {
  const detected = detectFormat(text);
  const confidence = getFormatConfidence(text, detected);

  return {
    format: detected,
    confidence: confidence,
    suggestion: confidence > 70 ? detected : null
  };
}