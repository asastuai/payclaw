// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import {IPoCVerifier} from "./interfaces/IPoCVerifier.sol";

/**
 * @title PoCVerifier
 * @notice Records off-chain-verified Proof-of-Context commitments and serves
 *         freshness queries to settlement gates (e.g., AgentWallet release
 *         conditions).
 *
 * @dev Pairs with the SDK-side `verifyPocCommitment` in `payclaw-ai`:
 *      1. The SDK verifies the Ed25519 signature off-chain (cheap).
 *      2. The SDK calls `submitVerifiedCommitment(...)` here on-chain.
 *      3. AgentWallet (or any consumer) reads `isFresh(commitmentHash)`
 *         before releasing funds.
 *
 *      Operator allowlist gate: only addresses approved by the contract
 *      owner can submit commitments. This prevents arbitrary forgery while
 *      keeping the on-chain footprint minimal.
 *
 *      Honest scope of what THIS contract guarantees:
 *      - The submitter at `submittedAt` was an approved operator at that
 *        block.
 *      - The commitment hash was registered exactly once.
 *      - The freshness check uses block.timestamp.
 *
 *      Honest scope of what THIS contract does NOT guarantee:
 *      - That the commitment hash corresponds to a real off-chain
 *        attestation. The submitter is trusted to verify the Ed25519
 *        signature before submitting. A malicious approved operator can
 *        submit garbage hashes; revocation is the lever.
 *      - That the upstream data source was honest. That layer is upstream
 *        and outside PoC's scope (see SPEC-WIRE-FORMAT-v0.1.md §6).
 *
 *      For a verifier that also enforces signature on-chain (at higher
 *      gas cost), see future work: integrate a Solidity Ed25519 library
 *      and add a `submitWithSignature(...)` overload. Phase 7b.
 */
contract PoCVerifier is IPoCVerifier {
    address public immutable owner;

    struct Commitment {
        address operator;
        uint64 submittedAt;
        uint64 freshnessHorizonSeconds;
        bool exists;
    }

    mapping(bytes32 => Commitment) private _commitments;
    mapping(address => bool) private _approvedOperators;

    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    function submitVerifiedCommitment(
        bytes32 commitmentHash,
        uint256 freshnessHorizonSeconds
    ) external override returns (uint256) {
        if (!_approvedOperators[msg.sender]) {
            revert NotApprovedOperator(msg.sender);
        }
        if (freshnessHorizonSeconds == 0 || freshnessHorizonSeconds > 365 days) {
            revert InvalidHorizon(freshnessHorizonSeconds);
        }
        if (_commitments[commitmentHash].exists) {
            revert CommitmentAlreadyExists(commitmentHash);
        }

        uint64 submittedAt = uint64(block.timestamp);
        _commitments[commitmentHash] = Commitment({
            operator: msg.sender,
            submittedAt: submittedAt,
            freshnessHorizonSeconds: uint64(freshnessHorizonSeconds),
            exists: true
        });

        emit CommitmentSubmitted(
            commitmentHash,
            msg.sender,
            submittedAt,
            freshnessHorizonSeconds
        );

        return submittedAt;
    }

    function isFresh(bytes32 commitmentHash) external view override returns (bool) {
        Commitment storage c = _commitments[commitmentHash];
        if (!c.exists) return false;
        unchecked {
            return
                block.timestamp <=
                uint256(c.submittedAt) + uint256(c.freshnessHorizonSeconds);
        }
    }

    function getCommitment(bytes32 commitmentHash)
        external
        view
        override
        returns (
            address operator,
            uint256 submittedAt,
            uint256 freshnessHorizonSeconds,
            bool exists
        )
    {
        Commitment storage c = _commitments[commitmentHash];
        return (c.operator, c.submittedAt, c.freshnessHorizonSeconds, c.exists);
    }

    function isApprovedOperator(address operator) external view override returns (bool) {
        return _approvedOperators[operator];
    }

    function approveOperator(address operator) external override onlyOwner {
        _approvedOperators[operator] = true;
        emit OperatorApproved(operator);
    }

    function revokeOperator(address operator) external override onlyOwner {
        _approvedOperators[operator] = false;
        emit OperatorRevoked(operator);
    }
}
