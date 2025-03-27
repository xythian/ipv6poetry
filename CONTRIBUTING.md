# Contributing to IPv6 Poetry

Thank you for your interest in contributing to the IPv6 Poetry project! This guide outlines how to contribute and notes our approach to AI-assisted development.

## How to Contribute

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch**: `git checkout -b feature-name`
4. **Make your changes**
5. **Run tests** to ensure they pass
6. **Commit your changes**: `git commit -am 'Add feature'`
7. **Push to your branch**: `git push origin feature-name`
8. **Submit a pull request**

## Development Environment

### Python Implementation
```bash
cd poetry-tools/python
pip install -e .[dev]
pytest tests
```

### JavaScript Implementation
```bash
cd poetry-tools/js
bun install
bun test
```

### Web Interface
```bash
cd web
bun install
bun run dev
```

## AI-Assisted Development

This project uses a collaborative model between human developers and AI assistants. We welcome contributions that continue this approach.

### Using AI in Your Contributions

If you use AI tools like GitHub Copilot, ChatGPT, Claude, or others in your contributions:

1. **Please acknowledge** the use of AI in your pull request description
2. **Review AI-generated code** thoroughly before submitting
3. **Ensure you understand** all code that's being contributed, even if AI-generated
4. **Add comments** for complex sections that benefited from AI assistance

### Our Philosophy on AI Collaboration

We see AI as a partner in the development process, not a replacement for human judgment. Quality, maintainability, and human oversight remain essential.

Benefits we've seen from AI collaboration:
- Accelerated implementation of well-defined features
- Improved code documentation and test coverage
- Rapid exploration of alternative approaches
- Reduction in boilerplate code

The final quality and correctness of all code, regardless of how it was created, remains the responsibility of the human contributors.

## Code Style and Standards

- Python code should follow PEP 8 with our custom allowances in setup.cfg
- JavaScript code should follow our ESLint configuration
- All code should include appropriate documentation
- Unit tests are required for new features

## Questions?

Feel free to open an issue with questions about contributing. We're happy to help you get started!