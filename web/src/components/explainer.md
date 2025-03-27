# IPv6 Poetry: A Human-Friendly Way to Communicate IPv6 Addresses

## What is IPv6 Poetry?

IPv6 Poetry is a system that transforms complex IPv6 addresses into memorable sequences of words. While computers work well with hexadecimal notation, humans find words more intuitive and easier to remember. 

## Why Do We Need This?

IPv6 addresses present significant usability challenges:

- **Length and Complexity**: Standard IPv6 addresses (e.g., `2001:0db8:85a3:0000:0000:8a2e:0370:7334`) contain 32 hexadecimal digits
- **Difficult Communication**: Try reading an IPv6 address over the phone or remembering it after hearing it once
- **Error-Prone**: Even abbreviated forms (like `2001:db8:85a3::8a2e:370:7334`) remain difficult to transcribe without errors

## How IPv6 Poetry Works

The IPv6 Poetry system:

1. **Divides** the 128-bit IPv6 address into eight 16-bit segments
2. **Maps** each segment to a word from a carefully chosen wordlist
3. **Creates** a sequence of 8 words that uniquely represent the address
4. **Adds** a 9th checksum word for error detection (derived from the CRC32 hash of all 8 segments)

For example, instead of remembering:

`2001:0db8:85a3:0000:0000:8a2e:0370:7334`

You can use the poetic phrase:

`schema deaf samarium zero zero engulf fields osmanli below5`

Where "below5" is the checksum word that helps detect transcription errors.

## Real-World Applications

IPv6 Poetry is useful in scenarios where:

- **Verbal Communication**: Phone calls, in-person meetings, or radio communication
- **Temporary DNS Outages**: When domain names aren't resolving
- **Network Troubleshooting**: Easily communicate network endpoints
- **IoT Device Setup**: Simplify device configuration in the field

## Technical Implementation

IPv6 Poetry is inspired by systems like [Diceware passwords](https://diceware.dmuth.org), which use word sequences to represent high-entropy values. The full specification is available in our [draft RFC](/rfc).

## Contributing

This is an open-source project in active development. We welcome contributions, feedback, and ideas!

- **GitHub Repository**: [github.com/xythian/ipv6poetry](https://github.com/xythian/ipv6poetry)
- **Report Issues**: If you find a bug or have a suggestion, please [open an issue](https://github.com/xythian/ipv6poetry/issues)
- **Improvements**: Pull requests are welcome for both the code and the wordlist

### AI-Assisted Development

🤖 This project was developed with assistance from [Claude Code](https://claude.ai/code), Anthropic's AI coding assistant. It serves as both a useful tool and an exploration of how AI can collaborate with humans in software development. See our [README](https://github.com/xythian/ipv6poetry#ai-collaboration) for more details on this aspect of the project.

## References

- [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952) - A Recommendation for IPv6 Address Text Representation
- [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) - Uniform Resource Identifier (URI): Generic Syntax