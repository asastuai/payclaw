// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {PoCVerifier} from "../src/PoCVerifier.sol";
import {IPoCVerifier} from "../src/interfaces/IPoCVerifier.sol";

contract PoCVerifierTest is Test {
    PoCVerifier internal verifier;
    address internal owner = address(0x1);
    address internal operator = address(0x2);
    address internal attacker = address(0x3);

    bytes32 internal sampleHash = keccak256("test commitment");

    function setUp() public {
        vm.prank(owner);
        verifier = new PoCVerifier(owner);
    }

    function test_owner_set_at_construction() public view {
        assertEq(verifier.owner(), owner);
    }

    function test_owner_can_approve_operator() public {
        vm.prank(owner);
        verifier.approveOperator(operator);
        assertTrue(verifier.isApprovedOperator(operator));
    }

    function test_non_owner_cannot_approve_operator() public {
        vm.prank(attacker);
        vm.expectRevert(PoCVerifier.NotOwner.selector);
        verifier.approveOperator(operator);
    }

    function test_approved_operator_can_submit_commitment() public {
        vm.prank(owner);
        verifier.approveOperator(operator);

        vm.prank(operator);
        uint256 submittedAt = verifier.submitVerifiedCommitment(sampleHash, 60);

        assertEq(submittedAt, block.timestamp);
        assertTrue(verifier.isFresh(sampleHash));
    }

    function test_unapproved_caller_cannot_submit() public {
        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(
                IPoCVerifier.NotApprovedOperator.selector,
                attacker
            )
        );
        verifier.submitVerifiedCommitment(sampleHash, 60);
    }

    function test_zero_horizon_rejected() public {
        vm.prank(owner);
        verifier.approveOperator(operator);

        vm.prank(operator);
        vm.expectRevert(
            abi.encodeWithSelector(IPoCVerifier.InvalidHorizon.selector, 0)
        );
        verifier.submitVerifiedCommitment(sampleHash, 0);
    }

    function test_excessive_horizon_rejected() public {
        vm.prank(owner);
        verifier.approveOperator(operator);

        uint256 tooLong = 366 days;
        vm.prank(operator);
        vm.expectRevert(
            abi.encodeWithSelector(IPoCVerifier.InvalidHorizon.selector, tooLong)
        );
        verifier.submitVerifiedCommitment(sampleHash, tooLong);
    }

    function test_double_submit_rejected() public {
        vm.prank(owner);
        verifier.approveOperator(operator);

        vm.prank(operator);
        verifier.submitVerifiedCommitment(sampleHash, 60);

        vm.prank(operator);
        vm.expectRevert(
            abi.encodeWithSelector(
                IPoCVerifier.CommitmentAlreadyExists.selector,
                sampleHash
            )
        );
        verifier.submitVerifiedCommitment(sampleHash, 60);
    }

    function test_fresh_until_horizon_then_stale() public {
        vm.prank(owner);
        verifier.approveOperator(operator);

        vm.prank(operator);
        verifier.submitVerifiedCommitment(sampleHash, 60);

        // Fresh at submit time + 30s
        vm.warp(block.timestamp + 30);
        assertTrue(verifier.isFresh(sampleHash));

        // Fresh at exactly horizon
        vm.warp(block.timestamp + 30);
        assertTrue(verifier.isFresh(sampleHash));

        // Stale 1s after horizon
        vm.warp(block.timestamp + 1);
        assertFalse(verifier.isFresh(sampleHash));
    }

    function test_revoked_operator_cannot_submit_new() public {
        vm.prank(owner);
        verifier.approveOperator(operator);

        vm.prank(operator);
        verifier.submitVerifiedCommitment(sampleHash, 60);

        vm.prank(owner);
        verifier.revokeOperator(operator);

        bytes32 secondHash = keccak256("second commitment");
        vm.prank(operator);
        vm.expectRevert(
            abi.encodeWithSelector(
                IPoCVerifier.NotApprovedOperator.selector,
                operator
            )
        );
        verifier.submitVerifiedCommitment(secondHash, 60);

        // Original commitment still queryable.
        assertTrue(verifier.isFresh(sampleHash));
    }

    function test_get_commitment_returns_full_record() public {
        vm.prank(owner);
        verifier.approveOperator(operator);

        vm.prank(operator);
        verifier.submitVerifiedCommitment(sampleHash, 90);

        (
            address recordedOperator,
            uint256 submittedAt,
            uint256 horizon,
            bool exists
        ) = verifier.getCommitment(sampleHash);

        assertEq(recordedOperator, operator);
        assertEq(submittedAt, block.timestamp);
        assertEq(horizon, 90);
        assertTrue(exists);
    }

    function test_get_commitment_for_unknown_hash() public view {
        (
            address recordedOperator,
            uint256 submittedAt,
            uint256 horizon,
            bool exists
        ) = verifier.getCommitment(keccak256("unknown"));

        assertEq(recordedOperator, address(0));
        assertEq(submittedAt, 0);
        assertEq(horizon, 0);
        assertFalse(exists);
    }
}
