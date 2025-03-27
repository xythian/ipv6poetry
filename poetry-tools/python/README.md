# IPv6 Poetry Tools (Python)

This package provides tools for converting IPv6 addresses to memorable phrases and back, making them easier to communicate, especially over voice channels.

## Features

- **Memorable Poetry**: Convert IPv6 addresses to a series of easy-to-pronounce words
- **Single Wordlist**: Uses a single wordlist of 65,536 memorable, easy-to-pronounce words
- **Error Detection**: Includes a checksum word to detect transcription errors
- **Command-line Interface**: Simple, easy-to-use CLI for all conversion methods

## Installation

```bash
# Install from the current directory
pip install -e .

# Or install from GitHub (if available)
# pip install git+https://github.com/username/ipv6poetry.git#subdirectory=poetry-tools/python
```

## Usage

### Generate Wordlist

Before using the tool, you need to generate the wordlist:

```bash
# Generate the wordlist in the default location
ipv6poetry generate

# Generate the wordlist in a specific directory
ipv6poetry generate --output-dir /path/to/output
```

### Convert IPv6 to Poetry

```bash
# Convert an IPv6 address to poetry
ipv6poetry to-poetry 2001:db8:85a3::8a2e:370:7334

# Specify a custom wordlist directory
ipv6poetry to-poetry 2001:db8::1 --wordlist-dir /path/to/wordlists
```

### Convert Poetry to IPv6

```bash
# Convert poetry back to IPv6
ipv6poetry to-ipv6 "schema deaf samarium the the engulf fields osmanli below5"

# Specify a custom wordlist directory
ipv6poetry to-ipv6 "schema deaf samarium the the engulf fields osmanli below5" --wordlist-dir /path/to/wordlists
```

## Python API

You can also use the library programmatically:

```python
from ipv6poetry.converters import IPv6PoetryConverter

# Initialize converter
converter = IPv6PoetryConverter("path/to/wordlists")

# Convert IPv6 to poetry
ipv6_address = "2001:db8:85a3::8a2e:370:7334"
poetic_phrase = converter.address_to_poetry(ipv6_address)
print(f"Poetic phrase: {poetic_phrase}")

# Convert poetry back to IPv6
ipv6_address = converter.poetry_to_address(poetic_phrase)
print(f"IPv6: {ipv6_address}")
```

## How It Works

- Each IPv6 address consists of 8 16-bit segments
- Each segment is mapped to a word from a wordlist of 65,536 memorable, easy-to-pronounce words
- A 9th word serves as a checksum to detect transcription errors
- The wordlist is specially curated for words that are:
  - Easy to pronounce
  - Phonetically distinct
  - Common enough to be familiar
  - Between 3-8 characters long

## Sample Output

```
IPv6: 2001:db8:85a3::8a2e:370:7334
Poetic phrase: schema deaf samarium the the engulf fields osmanli below5
```

## Error Detection

The format includes a checksum word that helps detect transcription errors:

```
# Correct phrase
ipv6poetry to-ipv6 "schema deaf samarium the the engulf fields osmanli below5"
IPv6: 2001:db8:85a3::8a2e:370:7334

# Incorrect phrase (changed "fields" to "house")
ipv6poetry to-ipv6 "schema deaf samarium the the engulf house osmanli below5"
Warning: Checksum mismatch! Expected 'appeal5', got 'below5'
The phrase may contain transcription errors
IPv6: 2001:db8:85a3::8a2e:5c:7334
```