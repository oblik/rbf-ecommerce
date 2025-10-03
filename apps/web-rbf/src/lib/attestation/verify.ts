import { recoverMessageAddress, type Hash } from 'viem';

/**
 * Verify attestation signature
 */
export async function verifyAttestationSignature(
  hash: Hash,
  signature: Hash,
  expectedSigner: `0x${string}`,
  allowedSigners: `0x${string}`[]
): Promise<{ valid: boolean; recoveredSigner?: `0x${string}` }> {
  try {
    const recoveredSigner = await recoverMessageAddress({
      message: { raw: hash },
      signature
    });

    const isAllowed = allowedSigners.some(
      s => s.toLowerCase() === recoveredSigner.toLowerCase()
    );

    return {
      valid: isAllowed && recoveredSigner.toLowerCase() === expectedSigner.toLowerCase(),
      recoveredSigner
    };
  } catch (error) {
    console.error('Signature verification error:', error);
    return { valid: false };
  }
}
