# ENV Converter

A client-side tool for converting environment variables between common configuration formats used in modern development workflows.

## Live Demo

**https://risa-org.github.io/envconverter/**

## Features

- Convert between 7 configuration formats
- Automatic format detection
- Secret detection with security warnings
- Client-side processing (no data uploaded)
- Keyboard shortcuts for efficiency
- Copy to clipboard and download functionality

## Supported Formats

- `.env` files
- Docker Compose environment blocks
- Kubernetes ConfigMaps
- JSON objects
- YAML key-value pairs
- Shell export statements (Bash/Zsh)
- Terraform `.tfvars` files

## Security

All conversion happens locally in your browser. No data is transmitted to any server. The tool includes detection for common secret patterns including API keys, passwords, AWS credentials, JWT tokens, and private keys.

## Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Keyboard Shortcuts

- `Ctrl+Enter` - Execute conversion
- `Ctrl+D` - Auto-detect input format
- `Ctrl+S` - Download output file

## Technical Stack

- JavaScript (ES6 modules)
- Vite build system
- js-yaml for YAML parsing
- CSS3 for styling

## Contributing

Feedback and contributions are welcome. Please open an issue to discuss proposed changes or report bugs before submitting pull requests.

## License

MIT License - see LICENSE file for details.