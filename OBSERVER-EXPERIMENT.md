# Observer experiment · Dakini Code

Date: 2026-09-13. Scope: a standalone Dakini experiment, running in Node and the browser. No Aura, KIRA, Aukora authority, remote node, GPU, or live memory shard was modified or tested. No paid model calls or external data were used.

## Results

The code is a systematic ternary **[54, 27, 4]** code. Its 27 independent source trits allow `3^27` source states. Its 27 line-sum checks add redundancy; they do not add information. Harmonic Lab still selects one of **27** settings using **three** trits. These are different state spaces.

| Experiment | Measured result |
|---|---|
| All 108 single-symbol corruptions | Detected; all syndromes distinct |
| All 5,724 double-symbol corruptions | Detected; none imitate a single-symbol syndrome |
| All 198,432 triple-symbol corruptions | Detected; 216 imitate a single-symbol syndrome |
| One changed source cell, then re-encode | Exactly four stored symbols differ |
| One changed source cell, frozen parity | One stored symbol differs; three checks fail |
| One changed source cell plus its three checks | Four changes; parity passes |
| Alternating eight-corner source change | Eight source changes; parity unchanged |
| Six readings over 256 deterministic cubes | 1,536 exact source reconstructions |
| Zero, maximum, and all 256 single-bit digests | 258 exact 32-byte round-trips |
| Original signature | Accepted with its held verifier key |
| Replacement and its newly computed hash | Digest can match the substituted value; original signature fails |
| Unrelated public key or changed signature | Verification fails |

The Node suite has 23 passing tests, including strict malformed-input checks, independent Node SHA-256 comparison, and existing glyph/harmonic regressions. Chrome 152.0.7977.83 repeated the five experiment groups in a real browser worker. Desktop and 390 × 844 browser checks covered all four interactive cases, six faces, digest padding, result export, reference retention across modes, Harmonic Lab audio suspension on entering Observer, About, and recovery from unavailable workers. Safari and human recognition or retrieval performance are not established by these checks.

## Representation

Source index is `x + 3y + 9z`, with each coordinate in `0..2`. Source cell `i` contributes to the three parity positions `y + 3z`, `9 + x + 3z`, and `18 + x + 3y`. Each sum is reduced modulo three and displayed as `−1, 0, +1`. A word stores the 27 source symbols followed by the 27 parity symbols. Its syndrome is recomputed parity minus stored parity, modulo three.

The exhaustive distance check independently constructs the 27 × 54 parity-check matrix, compares its single-error columns with the implementation, and enumerates every weight-one, weight-two, and weight-three error vector. Linearity makes these results independent of the starting codeword. No such vector has zero syndrome; an exhibited weight-four vector does. This establishes minimum distance four for this mathematical construction.

Consequences: at most one unknown-position symbol error is uniquely correctable **if that bound is independently known**. A nonzero syndrome alone does not establish that bound. Three parity errors can imitate one source error; correcting that guess creates a different valid codeword. The UI reports a candidate and never repairs automatically. Coordinated replacements and some larger corruptions are invisible to parity.

The source-only parity kernel has dimension eight: along each axis, the vectors whose entries sum to zero form a two-dimensional subspace; their three-axis tensor product has dimension `2^3 = 8`. Thus the parity map has rank 19, and a reachable parity value corresponds to `3^8 = 6,561` source cubes. One explicit kernel element places `[+1, −1, −1, +1, −1, +1, +1, −1]` at source indices `[0, 1, 3, 4, 9, 10, 12, 13]`, zero elsewhere. Retaining source data matters.

## Six readings

Each face has nine rays of three depth-ordered trits. Digits `0, 1, 2` represent trits `0, +1, −1`. Each ray becomes one base-27 symbol, displayed with an existing Dakini glyph. Nine base-27 symbols therefore carry all 27 trits. Reconstruction uses the selected face's declared orientation and digit order. It is exact because depth is encoded explicitly, not because an ordinary opaque projection preserves hidden cells.

This uses existing glyph IDs as a display alphabet. It does not decode historical script. The primary instrument keeps its existing musical mapping.

## Digest and signature

The canonical bytes are the UTF-8 domain separator `dakini.observer.v1` followed by a NUL, then exactly 54 bytes. Each trit is one byte: `−1 → 2`, `0 → 0`, `+1 → 1`. Fixed length and ordering avoid JSON, whitespace, locale, and rendering ambiguities. SHA-256 covers these bytes, including parity.

The 32 digest bytes become an unsigned big-endian integer. Since `7^91 < 2^256 ≤ 7^92`, exactly 92 base-seven positions suffice for every digest. Four complete 27-cell cubes supply 108 positions, with 16 leading padding zeros. Decoder validation rejects incorrect lengths, sparse inputs, non-integers, digits outside `0..6`, nonzero padding, and values above `2^256−1`. Decoding restores all 32 bytes, including leading zeros. The seven-state digest display is neither ternary nor compression; hexadecimal and binary remain simpler interchange formats.

**Keep as reference** uses Web Crypto to generate an ephemeral ECDSA P-256 key and sign the canonical bytes with SHA-256. Only the public key, signature, and digest are retained; the private key is not returned or exported. Future verification recomputes the bytes and holds that reference key fixed. Replacing data and its displayed hash cannot create a valid signature under the held key.

This is a local demonstration trust setup. The same browser owns the reference-selection UI and can deliberately create a new reference. It does not establish signer identity, independent process isolation, durable key custody, freshness, replay protection, consensus, or permission to execute. A signature also does not prove the semantic truth of its payload. Those require separate system design and evidence.

## What can move into Aura / Aukora next

Keep authoritative records and the existing admission path as the source of truth. A separate optional observer may consume versioned records, recompute verification against independently trusted references, and render a view with no authority of its own. Do not let glyph similarity, line-sum agreement, a model's assertion, or this local demo's key select trusted records or authorize an operation.

Before adopting error correction for memory shards, define the fault model, who holds the trusted reference, byte ordering, versioning, exact shard layout, erasure/error assumptions, and recovery ownership. Compare against existing checksums, replication, and established erasure coding for the actual failure model. The present tests do not establish a distributed recovery protocol or H200 deployment claim.

For a human-facing Aura view, compare this representation against a flat table on a frozen change-detection or retrieval task. Measure accuracy, time, false confidence, and accessibility. Mathematical reversibility alone does not establish better recall or retrieval. The determinant exponent 108 from a separate four-axis transform supplies no evidence for these outcomes.

## Reproduce

Run `npm test` and `npm run check`. Open Dakini, select **Observer**, and press **Run the checks** to repeat the experiment in a browser worker. **Export test results** saves the current run. `tests/observer.test.mjs` contains the regression checks; `lib/observer-experiment.ts` is the portable experiment; the UI never treats its report as authority.
