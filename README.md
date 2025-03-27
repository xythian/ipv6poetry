# IPv6 Poetry

Convert IPv6 addresses to memorable poetic phrases and back, using a unified wordlist and checksum mechanism.

> 🤖 **Development Note**: This project was developed with assistance from [Claude Code](https://claude.ai/code), Anthropic's AI coding assistant. It serves both as a useful tool and as an exploration of AI collaboration in software development.

## Overview

IPv6 addresses are difficult to communicate verbally and remember due to their length and complexity. IPv6 Poetry provides a solution by mapping IPv6 addresses to sequences of common words that are easier to remember, pronounce, and transcribe.

For example, the address `2001:db8::1` becomes the poetic phrase `schema deaf the the the the the and rules`.

## Features

- **Bidirectional Conversion**: Convert from IPv6 to poetry and back
- **Error Detection**: Includes a checksum word to detect transcription errors
- **Multiple Implementations**: Available in Python and JavaScript
- **Web Interface**: Easy-to-use web interface at [ipv6poetry.org](https://ipv6poetry.org)
- **RFC Compliant**: Follows standard IPv6 address normalization (RFC 5952)

## Project Structure

- `/poetry-tools/python/` - Python implementation
- `/poetry-tools/js/` - JavaScript/TypeScript implementation
- `/web/` - Web interface (Astro.js)
- `/wordlists/` - Wordlist files
- `/tests/` - Cross-implementation compatibility tests

## Getting Started

### Python

```bash
cd poetry-tools/python
pip install -e .

# Convert IPv6 to poetry
ipv6poetry to-poetry 2001:db8::1

# Convert poetry back to IPv6
ipv6poetry to-ipv6 "schema deaf the the the the the and rules"
```

### JavaScript

```bash
cd poetry-tools/js
npm install

# Convert IPv6 to poetry
npm run to-poetry 2001:db8::1

# Convert poetry back to IPv6
npm run to-ipv6 "schema deaf the the the the the and rules"
```

### Web Interface

```bash
cd web
bun install
bun run dev
```

Then open http://localhost:4321 in your browser.

## How It Works

1. An IPv6 address is split into 8 segments of 16 bits each
2. Each segment is converted to a decimal value (0-65535)
3. Each value is used as an index into a unified wordlist of 65,536 words
4. A CRC32 checksum of all segments is calculated and used as a 9th word
5. The words are joined with spaces to form the poetic phrase

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Testing

Run unit tests:

```bash
# Python tests
cd poetry-tools/python
pytest tests

# JavaScript tests
cd poetry-tools/js
npm test

# Compatibility test (ensure both implementations produce the same results)
./tests/compatibility_test.js
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Diceware for creating memorable passphrases
- Based on similar concepts to what3words for location encoding

## AI Collaboration

This project explores the collaboration between human developers and AI assistants in software development. The code, documentation, and website were created in partnership with [Claude Code](https://claude.ai/code), Anthropic's AI coding assistant.

### Development Process

- Initial concept and requirements were specified by a human
- Implementation details, algorithms, and code structure were developed collaboratively
- Claude Code contributed to:
  - Python and JavaScript implementations
  - Unit test development
  - Documentation and website content
  - Build and deployment configuration

This experiment demonstrates how AI can enhance developer productivity while preserving human creative direction. The resulting code quality, readability, and maintainability benefited from this collaboration.

### Reflections

Working with an AI assistant on this project offered several insights:
- AI can efficiently implement complex algorithms when given clear requirements
- It can be helpful to get working code based on the unclear requirements to more rapidly discover where requirements need to be clearer
- Iteration being fast and code creation being "cheap" (and getting cheaper) likely means a shift in how we approach software development to maximize effectiveness
- Human oversight remains essential for design decisions and quality assurance
- The conversation-based approach allowed for iterative refinement
- AI can handle both high-level architecture and low-level implementation details

We welcome feedback on both the IPv6 Poetry concept itself and the hybrid AI/human development approach.