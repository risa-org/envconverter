# Contributing to ENV Converter

Thanks for your interest in contributing! ENV Converter is a client-side tool for converting environment variables between formats. Contributions of all kinds are welcome — bug fixes, new format parsers, UI improvements, and documentation.

Please read this guide before opening issues or submitting pull requests.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Adding a New Format Parser](#adding-a-new-format-parser)
- [Code Style](#code-style)

---

## Project Structure

```
envconverter/
├── parsers/           # One file per supported format
│   ├── dotenv.js
│   ├── docker.js
│   ├── kubernetes.js
│   ├── json.js
│   ├── yaml.js
│   ├── shell.js
│   └── terraform.js
├── utils/
│   ├── formatDetector.js   # Auto-detect input format logic
│   └── secretDetector.js   # Secret/credential pattern detection
├── app.js             # Main application logic and UI wiring
├── index.html
├── style.css
└── vite.config.js
```

Each parser in `parsers/` is self-contained and exports three functions: `parse()`, `stringify()`, and `validate()`. The app registers them in `app.js` and they are plug-and-play — adding a new format is straightforward (see [Adding a New Format Parser](#adding-a-new-format-parser)).

---

## Local Development

**Requirements:** Node.js 18+

```bash
# Clone the repo
git clone https://github.com/risa-org/envconverter.git
cd envconverter

# Install dependencies
npm install

# Start the dev server (opens at http://localhost:5173)
npm run dev

# Build for production
npm run build
```

No additional configuration is needed. Everything runs client-side with no backend.

---

## Reporting Bugs

Before opening a bug report, please check that the issue hasn't already been reported.

Use the **Bug Report** issue template and include:

- The input you pasted and the format selected
- The output or error you received
- The output you expected
- Your browser and OS

The more specific you are, the faster it gets fixed. Pasting a minimal example that reproduces the issue is very helpful.

---

## Suggesting Features

Use the **Feature Request** issue template. Before submitting, consider:

- Is this useful for the general case, or very specific to your setup?
- Does it fit the project's scope — converting environment variables between formats, client-side only?

The most welcome feature requests are:
- New format parsers (TOML, GitHub Actions `env:`, etc.)
- Improvements to existing parsers (better edge case handling, multiline values, etc.)
- UX improvements (swap button, clear button, better keyboard shortcuts)

Please open an issue to discuss before writing a large PR — it avoids wasted effort if the direction doesn't align.

---

## Submitting a Pull Request

1. **Fork** the repository and create a branch from `master`:
   ```bash
   git checkout -b fix/dotenv-lowercase-keys
   # or
   git checkout -b feature/toml-parser
   ```

2. **Make your changes.** Keep commits focused — one logical change per commit.

3. **Test manually** across a few browsers if possible. Since this is a client-side tool with no test suite currently, manual testing is important. Run `npm run build` and verify there are no build errors.

4. **Open a Pull Request** against `master`. In the PR description, explain:
   - What the change does
   - Why it's needed (link to the relevant issue if one exists)
   - Any edge cases you considered or tested

PRs that reference an open issue are preferred. If no issue exists for your change, consider opening one first to discuss the approach.

---

## Adding a New Format Parser

This is the most common type of contribution. Here's exactly what you need to do:

### 1. Create the parser file

Add `parsers/yourformat.js`. Every parser must export these three functions:

```js
// Parse text input → plain key-value object { KEY: "value" }
export function parse(text) { ... }

// Stringify plain key-value object → formatted text output
export function stringify(obj) { ... }

// Validate input text, return { valid: true } or { valid: false, error: "..." }
export function validate(text) {
  try {
    parse(text);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

The internal data format is always a flat `{ KEY: "value" }` object where all values are strings. Your `parse()` must produce this and your `stringify()` must consume it.

### 2. Register the parser in `app.js`

```js
import * as yourformat from './parsers/yourformat.js';

const parsers = {
  // existing parsers...
  yourformat,
};
```

### 3. Add the format option to both `<select>` elements in `index.html`

```html
<option value="yourformat">Your Format Name</option>
```

Both the input and output `<select>` elements need the new option.

### 4. Add a download extension in `app.js`

```js
const extensions = {
  // existing entries...
  yourformat: 'ext',
};
```

### 5. Update `formatDetector.js`

Add detection logic in `detectFormat()` so auto-detect works for your format, and add a confidence scorer in `getFormatConfidence()`.

### 6. Add an example (optional but appreciated)

Add an entry to the `examples` object in `app.js` and a corresponding card in `index.html` to demonstrate a common conversion involving your format.

---

## Code Style

- **ES6 modules** throughout — `import`/`export`, no CommonJS
- **No build-time transpilation assumptions** — the code targets modern browsers via Vite
- **No frameworks** — vanilla JS only, keep it that way
- Errors thrown from `parse()` should have clear, human-readable messages that explain what went wrong and where (see existing parsers for examples)
- Keep parsers self-contained — if a parser needs a dependency (like `js-yaml`), import it at the top of that parser file only
- All conversion happens client-side. Do not introduce any network calls

---

## Questions?

Open an issue with the `question` label or leave a comment on a relevant existing issue. Happy to help.
