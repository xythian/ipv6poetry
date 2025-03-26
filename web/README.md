# IPv6 Poetry Web Interface

A modern web interface for the IPv6 Poetry project, which converts IPv6 addresses to memorable word sequences and back.

## Overview

This web application provides:

1. An interactive converter tool to translate between IPv6 addresses and poetic phrases
2. Detailed explanation of the IPv6 Poetry concept and its benefits
3. Access to the draft RFC specification
4. Simple, responsive design that works across devices

## Project Structure

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── converter.tsx    # React component for the converter tool
│   │   └── explainer.md     # Markdown component with project explanation
│   ├── layouts/
│   │   └── Layout.astro     # Main layout with header and footer
│   ├── lib/
│   │   └── ipv6poetry.ts    # Core converter implementation for the browser
│   ├── pages/
│   │   ├── index.astro      # Homepage with converter and explanation
│   │   └── rfc.astro        # RFC draft page
└── package.json
```

## Features

- **Bi-directional Conversion**: Convert between IPv6 addresses and poetic phrases
- **Error Handling**: Proper validation and error messages for invalid inputs
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Accessible**: Built with web accessibility in mind
- **Fast**: Client-side conversion with no server round-trips needed

## Getting Started

### Prerequisites

- Node.js 18+ or Bun

### Installation

```bash
# Using npm
npm install

# Using Bun
bun install
```

### Development

```bash
# Start the development server
npm run dev
# OR
bun dev
```

This starts a local development server at http://localhost:4321

### Build for Production

```bash
npm run build
# OR
bun build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## Related Projects

- [`/poetry-tools/js`](../poetry-tools/js): JavaScript command-line implementation
- [`/poetry-tools/python`](../poetry-tools/python): Python implementation
- [`/wordlists`](../wordlists): Wordlists used for conversion

## License

MIT
