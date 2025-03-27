import ipaddress
import zlib

def calculate_checksum(decimal_values):
    # Convert segments to bytes
    bytes_data = b''
    for segment in decimal_values:
        bytes_data += segment.to_bytes(2, byteorder='big')
    
    # Use zlib CRC32 for a simple checksum
    checksum = zlib.crc32(bytes_data) & 0xFFFF  # Keep only 16 bits
    return checksum

def process_address(addr):
    print(f"Original: {addr}")
    
    # Normalize with ipaddress module
    normalized = str(ipaddress.IPv6Address(addr))
    print(f"Normalized: {normalized}")
    
    # Get segments
    if '::' in normalized:
        parts = normalized.split('::')
        left_parts = parts[0].split(':') if parts[0] else []
        right_parts = parts[1].split(':') if parts[1] else []
        missing = 8 - len(left_parts) - len(right_parts)
        segments = left_parts + ['0'] * missing + right_parts
    else:
        segments = normalized.split(':')
    
    print(f"Segments: {segments}")
    
    # Convert to decimal
    decimal_values = [int(segment, 16) for segment in segments]
    print(f"Decimal values: {decimal_values}")
    
    # Calculate checksum
    checksum = calculate_checksum(decimal_values)
    print(f"Checksum: {checksum}")

print("== Test 1: Full Format ==")
process_address("2001:0db8:85a3:0000:0000:8a2e:0370:7334")

print("\n== Test 2: Compressed Format ==")
process_address("2001:db8:85a3::8a2e:370:7334")
