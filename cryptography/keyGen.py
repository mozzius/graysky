from ecdsa import SECP256k1, SigningKey

from multiformats.multibase import Multibase

# Generate a private key
sk = SigningKey.generate(curve=SECP256k1)
print(f"Signing Key: {sk.to_string().hex()}")
print(f"Verifying Key: {sk.verifying_key.to_string().hex()}")
print(f"Verifying Key (compressed): {sk.verifying_key.to_string('compressed').hex()}")


# Encoding to multibase

# When encoding public keys as strings, the preferred representation uses multibase (with base58btc specifically) and a multicode prefix to indicate the specific key type. By embedding metadata about the type of key in the encoding itself, they can be parsed unambiguously. The process for encoding a public key in this format is:
#
#     Encode the public key curve "point" as bytes. Be sure to use the smaller "compact" or "compressed" representation. This is usually easy for k256, but might require a special argument or configuration for p256 keys
#     Prepend the appropriate curve multicodec value, as varint-encoded bytes, in front of the key bytes:
#         p256 (compressed, 33 byte key length): p256-pub, code 0x1200, varint-encoded bytes: [0x80, 0x24]
#         k256 (compressed, 33 byte key length): secp256k1-pub, code 0xE7, varint bytes: [0xE7, 0x01]
#     Encode the combined bytes with with base58btc, and prefix with a z character, yielding a multibase-encoded string

multibase = Multibase(
    name="base58btc",
    code="z",
)

encoded = multibase.encode(b"\xE7\x01" + sk.verifying_key.to_string("compressed"))

print(f"Encoded: {encoded}")
