// app.js
// Main application logic

import * as dotenv from './parsers/dotenv.js';
import * as docker from './parsers/docker.js';
import * as kubernetes from './parsers/kubernetes.js';
import * as json from './parsers/json.js';
import * as yaml from './parsers/yaml.js';
import * as shell from './parsers/shell.js';
import * as terraform from './parsers/terraform.js';

import { detectSecrets, formatSecretWarnings } from './utils/secretDetector.js';
import { detectFormat, getFormatConfidence } from './utils/formatDetector.js';

// Parser registry
const parsers = {
  dotenv,
  docker,
  kubernetes,
  json,
  yaml,
  shell,
  terraform
};

// Example data
const examples = {
  'dotenv-to-docker': {
    input: `DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=sk_test_abc123def456
DEBUG=true
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379`,
    inputFormat: 'dotenv',
    outputFormat: 'docker'
  },
  'dotenv-to-k8s': {
    input: `DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=sk_test_abc123def456
DEBUG=true
APP_ENV=production`,
    inputFormat: 'dotenv',
    outputFormat: 'kubernetes'
  },
  'k8s-to-dotenv': {
    input: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database-url: postgresql://localhost:5432/mydb
  api-key: sk_test_abc123def456
  debug: "true"
  app-env: production`,
    inputFormat: 'kubernetes',
    outputFormat: 'dotenv'
  },
  'dotenv-to-shell': {
    input: `DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=sk_test_abc123def456
DEBUG=true
PORT=3000`,
    inputFormat: 'dotenv',
    outputFormat: 'shell'
  },
  'dotenv-to-terraform': {
    input: `DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=sk_test_abc123def456
DEBUG=true
PORT=3000`,
    inputFormat: 'dotenv',
    outputFormat: 'terraform'
  }
};

// DOM elements
const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const inputFormat = document.getElementById('input-format');
const outputFormat = document.getElementById('output-format');
const convertBtn = document.getElementById('convert-btn');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const inputError = document.getElementById('input-error');
const toast = document.getElementById('toast');
const autoDetectBtn = document.getElementById('auto-detect-btn');
const formatHint = document.getElementById('format-hint');
const secretWarning = document.getElementById('secret-warning');

// Event listeners
convertBtn.addEventListener('click', handleConvert);
copyBtn.addEventListener('click', handleCopy);
downloadBtn.addEventListener('click', handleDownload);
autoDetectBtn.addEventListener('click', handleAutoDetect);

// Example buttons
document.querySelectorAll('.example-card').forEach(card => {
  card.addEventListener('click', () => {
    const exampleKey = card.dataset.example;
    loadExample(exampleKey);
  });
});

// Auto-convert on input change (debounced)
let convertTimeout;
inputText.addEventListener('input', () => {
  clearTimeout(convertTimeout);
  convertTimeout = setTimeout(() => {
    if (inputText.value.trim()) {
      // Auto-detect format
      updateFormatHint();
      // Auto-convert
      handleConvert();
    } else {
      hideError();
      hideSecretWarning();
      hideFormatHint();
    }
  }, 500);
});

// Update format hint when input changes
function updateFormatHint() {
  const input = inputText.value.trim();
  if (!input) {
    hideFormatHint();
    return;
  }

  const detected = detectFormat(input);
  const confidence = getFormatConfidence(input, detected);

  if (detected && confidence > 60) {
    const formatNames = {
      dotenv: '.env',
      docker: 'Docker Compose',
      kubernetes: 'Kubernetes ConfigMap',
      json: 'JSON',
      yaml: 'YAML',
      shell: 'Shell Export',
      terraform: 'Terraform'
    };

    formatHint.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 1L9 5L13 6L10 9L11 13L7 11L3 13L4 9L1 6L5 5L7 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Detected: ${formatNames[detected]} (${Math.round(confidence)}% confident)
    `;
    formatHint.classList.add('visible');
  } else {
    hideFormatHint();
  }
}

// Auto-detect button handler
function handleAutoDetect() {
  const input = inputText.value.trim();
  if (!input) {
    showToast('Enter some content first', 'error');
    return;
  }

  const detected = detectFormat(input);
  const confidence = getFormatConfidence(input, detected);

  if (detected && confidence > 50) {
    inputFormat.value = detected;
    showToast(`Auto-detected: ${detected.toUpperCase()}`, 'success');
    handleConvert();
  } else {
    showToast('Could not auto-detect format', 'error');
  }
}

// Convert function
function handleConvert() {
  const input = inputText.value.trim();
  const fromFormat = inputFormat.value;
  const toFormat = outputFormat.value;

  // Clear previous messages
  hideError();
  hideSecretWarning();

  if (!input) {
    showError('Please enter some content to convert');
    outputText.value = '';
    return;
  }

  try {
    // Parse input
    const fromParser = parsers[fromFormat];
    if (!fromParser) {
      throw new Error(`Unknown input format: ${fromFormat}`);
    }

    const data = fromParser.parse(input);

    // Check for secrets
    const secrets = detectSecrets(data);
    if (secrets.length > 0) {
      const warningMessage = formatSecretWarnings(secrets);
      showSecretWarning(warningMessage);
    }

    // Stringify output
    const toParser = parsers[toFormat];
    if (!toParser) {
      throw new Error(`Unknown output format: ${toFormat}`);
    }

    const output = toParser.stringify(data);
    outputText.value = output;

    // Show success feedback
    convertBtn.classList.add('success');
    setTimeout(() => {
      convertBtn.classList.remove('success');
    }, 300);

  } catch (error) {
    showError(error.message);
    outputText.value = '';
  }
}

// Copy to clipboard
async function handleCopy() {
  const output = outputText.value;
  
  if (!output) {
    showToast('Nothing to copy', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(output);
    showToast('Copied to clipboard!', 'success');
    
    // Visual feedback
    copyBtn.classList.add('success');
    setTimeout(() => {
      copyBtn.classList.remove('success');
    }, 300);
  } catch (error) {
    showToast('Failed to copy', 'error');
  }
}

// Download as file
function handleDownload() {
  const output = outputText.value;
  const format = outputFormat.value;
  
  if (!output) {
    showToast('Nothing to download', 'error');
    return;
  }

  const extensions = {
    dotenv: 'env',
    docker: 'yml',
    kubernetes: 'yml',
    json: 'json',
    yaml: 'yml',
    shell: 'sh',
    terraform: 'tfvars'
  };

  const ext = extensions[format] || 'txt';
  const filename = `config.${ext}`;
  
  const blob = new Blob([output], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast(`Downloaded as ${filename}`, 'success');
  
  // Visual feedback
  downloadBtn.classList.add('success');
  setTimeout(() => {
    downloadBtn.classList.remove('success');
  }, 300);
}

// Load example
function loadExample(exampleKey) {
  const example = examples[exampleKey];
  if (!example) return;

  inputText.value = example.input;
  inputFormat.value = example.inputFormat;
  outputFormat.value = example.outputFormat;
  
  // Trigger conversion
  handleConvert();
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Error handling
function showError(message) {
  inputError.innerHTML = `<strong>Error:</strong> ${message}`;
  inputError.classList.add('visible');
}

function hideError() {
  inputError.innerHTML = '';
  inputError.classList.remove('visible');
}

// Secret warning handling
function showSecretWarning(message) {
  secretWarning.innerHTML = message.replace(/\n/g, '<br>');
  secretWarning.classList.add('visible');
}

function hideSecretWarning() {
  secretWarning.innerHTML = '';
  secretWarning.classList.remove('visible');
}

// Format hint handling
function hideFormatHint() {
  formatHint.classList.remove('visible');
}

// Toast notification
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter to convert
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleConvert();
  }
  
  // Ctrl/Cmd + S to download
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (outputText.value) {
      handleDownload();
    }
  }

  // Ctrl/Cmd + D to auto-detect
  if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault();
    handleAutoDetect();
  }
});

// Initialize
window.addEventListener('load', () => {
  // Optional: load first example by default
  // loadExample('dotenv-to-docker');
});