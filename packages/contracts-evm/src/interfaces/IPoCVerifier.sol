// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

/**
 * @title IPoCVerifier
 * @notice On-chain verifier for Proof-of-Context commitments.
 *
 * @dev Design choice: signature verification stays OFF-CHAIN. EVM has no
 *      native Ed25519 precompile and pure-Solidity Ed25519 costs ~500k gas
 *      per verify. Instead, an approved off-chain verifier (e.g. a PayClaw
 *      SDK in an agent runtime) verifies the Ed25519 signature locally and
 *      submits the resulting commitment hash + timestamp + horizon on-chain.
 *      The on-chain contract enforces freshness and operator allowlisting.
 *
 *      This is the SDK-side enforcement model from PayClaw promoted to the
 *      contract level. It composes with the off-chain verifier without
 *      duplicating the cryptography on-chain.
 *
 *      Trust assumption: the submitter must be an approved operator. A
 *      malicious submitter can register false commitments under their own
 *      operator key, but cannot impersonate other operators. The
 *      operator-allowlist gate is what makes this model honest.
 *
 *      Wire format reference:
 *      https://github.com/asastuai/proof-of-context/blob/main/SPEC-WIRE-FORMAT-v0.1.md
 */
interface IPoCVerifier {
    /**
     * @notice Record a verified PoC commitment. Caller must be an approved operator.
     * @param commitmentHash The keccak256 of the canonical signing message
     *                       defined in PoC v0.1 wire format §5.
     * @param freshnessHorizonSeconds The horizon claimed by the off-chain attestation.
     * @return submittedAt The block timestamp at which this commitment was recorded.
     */
    function submitVerifiedCommitment(
        bytes32 commitmentHash,
        uint256 freshnessHorizonSeconds
    ) external returns (uint256 submittedAt);

    /**
     * @notice Check whether a commitment is recorded and within its horizon.
     * @param commitmentHash The hash to look up.
     * @return fresh True if recorded and (block.timestamp - submittedAt) <= horizon.
     */
    function isFresh(bytes32 commitmentHash) external view returns (bool fresh);

    /**
     * @notice Inspect a recorded commitment.
     */
    function getCommitment(bytes32 commitmentHash)
        external
        view
        returns (
            address operator,
            uint256 submittedAt,
            uint256 freshnessHorizonSeconds,
            bool exists
        );

    /**
     * @notice Whether the address is approved to submit commitments.
     */
    function isApprovedOperator(address operator) external view returns (bool);

    // -------- Admin --------

    /**
     * @notice Add an approved operator. Only owner.
     */
    function approveOperator(address operator) external;

    /**
     * @notice Remove an approved operator. Only owner.
     */
    function revokeOperator(address operator) external;

    // -------- Events --------

    event CommitmentSubmitted(
        bytes32 indexed commitmentHash,
        address indexed operator,
        uint256 submittedAt,
        uint256 freshnessHorizonSeconds
    );

    event OperatorApproved(address indexed operator);
    event OperatorRevoked(address indexed operator);

    // -------- Errors --------

    error NotApprovedOperator(address caller);
    error CommitmentAlreadyExists(bytes32 commitmentHash);
    error InvalidHorizon(uint256 horizon);
}
