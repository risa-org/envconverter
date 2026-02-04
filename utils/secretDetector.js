// utils/secretDetector.js
// Detect potential secrets in environment variables

const SECRET_PATTERNS = {
  apiKey: {
    regex: /^(api[_-]?key|apikey)$/i,
    message: 'API key detected'
  },
  password: {
    regex: /^.*(password|passwd|pwd|pass)$/i,
    message: 'Password field detected'
  },
  secret: {
    regex: /^.*(secret|token|auth)$/i,
    message: 'Secret/token detected'
  },
  awsKey: {
    regex: /^(aws[_-]?access[_-]?key|aws[_-]?secret)/i,
    message: 'AWS credential detected'
  },
  privateKey: {
    regex: /^.*(private[_-]?key|priv[_-]?key)$/i,
    message: 'Private key field detected'
  },
  jwt: {
    regex: /^(jwt|bearer[_-]?token)$/i,
    message: 'JWT/Bearer token detected'
  },
  stripe: {
    regex: /^(stripe[_-]?key|stripe[_-]?secret)$/i,
    message: 'Stripe key detected'
  },
  openai: {
    regex: /^(openai[_-]?key|openai[_-]?api[_-]?key)$/i,
    message: 'OpenAI API key detected'
  }
};

const VALUE_PATTERNS = {
  awsAccessKey: {
    regex: /^AKIA[0-9A-Z]{16}$/,
    message: 'AWS Access Key ID format detected'
  },
  stripeKey: {
    regex: /^(sk|pk)_(test|live)_[0-9a-zA-Z]{24,}$/,
    message: 'Stripe API key format detected'
  },
  openaiKey: {
    regex: /^sk-[a-zA-Z0-9]{48}$/,
    message: 'OpenAI API key format detected'
  },
  jwt: {
    regex: /^eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/,
    message: 'JWT token format detected'
  },
  privateKey: {
    regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
    message: 'Private key content detected'
  },
  base64Secret: {
    regex: /^[A-Za-z0-9+/]{32,}={0,2}$/,
    message: 'Possible base64-encoded secret'
  }
};

export function detectSecrets(variables) {
  const warnings = [];

  for (const [key, value] of Object.entries(variables)) {
    // Check key patterns
    for (const [patternName, pattern] of Object.entries(SECRET_PATTERNS)) {
      if (pattern.regex.test(key)) {
        warnings.push({
          key,
          type: 'key',
          pattern: patternName,
          message: pattern.message,
          severity: 'warning'
        });
        break; // Only report first match per key
      }
    }

    // Check value patterns
    for (const [patternName, pattern] of Object.entries(VALUE_PATTERNS)) {
      if (pattern.regex.test(value)) {
        warnings.push({
          key,
          type: 'value',
          pattern: patternName,
          message: pattern.message,
          severity: 'high'
        });
        break; // Only report first match per value
      }
    }
  }

  return warnings;
}

export function formatSecretWarnings(warnings) {
  if (warnings.length === 0) {
    return null;
  }

  const highSeverity = warnings.filter(w => w.severity === 'high');
  const normalWarnings = warnings.filter(w => w.severity === 'warning');

  let message = `⚠️ SECURITY WARNING: Detected ${warnings.length} potential secret${warnings.length > 1 ? 's' : ''}\n\n`;

  if (highSeverity.length > 0) {
    message += '🔴 HIGH RISK:\n';
    for (const warning of highSeverity) {
      message += `  • ${warning.key}: ${warning.message}\n`;
    }
    message += '\n';
  }

  if (normalWarnings.length > 0) {
    message += '⚡ POTENTIAL SECRETS:\n';
    for (const warning of normalWarnings) {
      message += `  • ${warning.key}: ${warning.message}\n`;
    }
    message += '\n';
  }

  message += '💡 RECOMMENDATION:\n';
  message += '  • Use environment-specific secret managers\n';
  message += '  • For Kubernetes: Use Secrets instead of ConfigMaps\n';
  message += '  • For Docker: Use Docker secrets or external vaults\n';
  message += '  • Never commit secrets to version control\n';

  return message;
}

export function hasSecrets(variables) {
  return detectSecrets(variables).length > 0;
}