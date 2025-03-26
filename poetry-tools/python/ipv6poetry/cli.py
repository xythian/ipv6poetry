#!/usr/bin/env python3
import os
import sys
import argparse
from ipv6poetry.converters import IPv6PoetryConverter
from ipv6poetry.wordlist_generator import MemorableWordlistGenerator

def main():
    parser = argparse.ArgumentParser(description="IPv6 Poetry Tools")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Get the absolute path to project's wordlists directory
    default_wordlist_dir = os.path.abspath(os.path.join(
        os.path.dirname(__file__), "../../../wordlists"
    ))
    
    # Generate wordlist command
    gen_parser = subparsers.add_parser("generate", help="Generate wordlist for IPv6 poetry")
    gen_parser.add_argument("--output-dir", default=default_wordlist_dir, 
                        help=f"Output directory for wordlist (default: {default_wordlist_dir})")

    # Convert IPv6 to poetry command
    to_poetry_parser = subparsers.add_parser("to-poetry", 
                                          help="Convert an IPv6 address to a poetic phrase")
    to_poetry_parser.add_argument("address", help="IPv6 address to convert")
    to_poetry_parser.add_argument("--wordlist-dir", default=default_wordlist_dir,
                               help=f"Directory containing wordlist (default: {default_wordlist_dir})")

    # Convert poetry to IPv6 command
    to_ipv6_parser = subparsers.add_parser("to-ipv6", 
                                        help="Convert a poetic phrase to an IPv6 address")
    to_ipv6_parser.add_argument("phrase", help="Poetic phrase to convert (in quotes)")
    to_ipv6_parser.add_argument("--wordlist-dir", default=default_wordlist_dir,
                             help=f"Directory containing wordlist (default: {default_wordlist_dir})")

    args = parser.parse_args()

    if args.command == "generate":
        print(f"Generating wordlist in {args.output_dir}...")
        
        # Create the output directory if it doesn't exist
        os.makedirs(args.output_dir, exist_ok=True)
        
        # Generate the memorable wordlist
        generator = MemorableWordlistGenerator(output_dir=args.output_dir)
        generator.generate()
        
        print("Wordlist generated successfully")
    
    elif args.command == "to-poetry":
        try:
            converter = IPv6PoetryConverter(args.wordlist_dir)
                
            poetic_phrase = converter.address_to_poetry(args.address)
            print(f"IPv6: {args.address}")
            print(f"Poetic phrase: {poetic_phrase}")
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    
    elif args.command == "to-ipv6":
        try:
            converter = IPv6PoetryConverter(args.wordlist_dir)
                
            ipv6_address = converter.poetry_to_address(args.phrase)
            print(f"Poetic phrase: {args.phrase}")
            print(f"IPv6: {ipv6_address}")
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()