# IPv6 Poetry Tools (JavaScript/TypeScript)

This package provides tools for converting IPv6 addresses to poetic phrases and back, as specified in the IPv6 Poetic Addressing proposal.

## Features

- Generate wordlists for the 8 categories specified in the RFC document
- Convert IPv6 addresses to poetic phrases
- Convert poetic phrases back to IPv6 addresses

## Installation

```bash
# Install dependencies
npm install

# Build the package
npm run build
```

## Usage

### Generate Wordlists

```bash
# Generate wordlists in the default location (../../wordlists)
npm run generate

# Generate wordlists in a specific directory
npm run generate -- --output-dir /path/to/output
```

### Convert IPv6 to Poetry

```bash
# Convert an IPv6 address to a poetic phrase
npm run to-poetry -- --address 2001:0db8:85a3:0000:0000:8a2e:0370:7334

# Specify a custom wordlist directory
npm run to-poetry -- --address 2001:db8::1 --wordlist-dir /path/to/wordlists
```

### Convert Poetry to IPv6

```bash
# Convert a poetic phrase back to an IPv6 address
npm run to-ipv6 -- --phrase "azure mountains silently watch ancient memories beyond clear horizons"

# Specify a custom wordlist directory
npm run to-ipv6 -- --phrase "azure mountains silently watch ancient memories beyond clear horizons" --wordlist-dir /path/to/wordlists
```

## JavaScript/TypeScript API

You can also use the library programmatically:

```typescript
import { WordlistGenerator, IPv6PoetryConverter } from 'ipv6poetry';

// Generate wordlists
const generator = new WordlistGenerator('wordlists');
await generator.generateAllCategories();

// Convert between IPv6 and poetry
const converter = new IPv6PoetryConverter('wordlists');
const poetic = await converter.addressToPoetry('2001:db8::1');
const ipv6 = await converter.poetryToAddress('azure mountains silently watch ancient memories beyond clear horizons');
```