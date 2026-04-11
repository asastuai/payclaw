// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import { IAgentWallet } from "./interfaces/IAgentWallet.sol";
import { IPolicyRegistry } from "./interfaces/IPolicyRegistry.sol";
import { IApprovalQueue } from "./interfaces/IApprovalQueue.sol";
import { IERC20 } from "./interfaces/IERC20.sol";

contract AgentWallet is IAgentWallet {
    address private _owner;
    address private _agent;
    bool private _agentActive;

    IPolicyRegistry public policyRegistry;
    IApprovalQueue public approvalQueue;

    bool private _initialized;
    bool private _reentrancyLock;

    modifier onlyOwner() {
        require(msg.sender == _owner, "AgentWallet: not owner");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == _agent && _agentActive, "AgentWallet: not active agent");
        _;
    }

    modifier nonReentrant() {
        require(!_reentrancyLock, "AgentWallet: reentrant call");
        _reentrancyLock = true;
        _;
        _reentrancyLock = false;
    }

    function initialize(
        address ownerAddr,
        address agentAddr,
        address policyRegistryAddr,
        address approvalQueueAddr
    ) external {
        require(!_initialized, "AgentWallet: already initialized");
        _initialized = true;
        _owner = ownerAddr;
        _agent = agentAddr;
        _agentActive = true;
        policyRegistry = IPolicyRegistry(policyRegistryAddr);
        approvalQueue = IApprovalQueue(approvalQueueAddr);

        emit AgentSet(agentAddr);
    }

    // --- Core Actions ---

    function pay(address to, address token, uint256 amount, bytes32 memo) external onlyAgent nonReentrant {
        // For MVP, usdValue == amount (assuming stablecoins with 6 decimals, value passed as 8-decimal USD)
        // In production, this would query a Chainlink oracle
        uint256 usdValue = amount;

        IPolicyRegistry.CheckResult memory result = policyRegistry.checkTransaction(
            address(this), to, token, usdValue
        );

        if (!result.allowed) {
            revert(result.reason);
        }

        if (result.needsApproval) {
            approvalQueue.createRequest(address(this), to, token, amount, memo);
            emit ApprovalRequested(approvalQueue.pendingCount(address(this)), to, token, amount);
            return;
        }

        // Execute transfer
        _transferToken(token, to, amount);
        policyRegistry.recordSpend(address(this), usdValue);

        emit PaymentExecuted(to, token, amount, memo);
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address router
    ) external onlyAgent nonReentrant {
        // Check policy allows swaps
        IPolicyRegistry.Policy memory policy = policyRegistry.getPolicy(address(this));
        require(policy.swapsEnabled, "AgentWallet: swaps disabled");

        // Check router is allowed
        if (policy.allowedRouters.length > 0) {
            bool routerAllowed = false;
            for (uint256 i = 0; i < policy.allowedRouters.length; i++) {
                if (policy.allowedRouters[i] == router) {
                    routerAllowed = true;
                    break;
                }
            }
            require(routerAllowed, "AgentWallet: router not allowed");
        }

        // Check spending limits (using amountIn as usdValue for stablecoins)
        IPolicyRegistry.CheckResult memory result = policyRegistry.checkTransaction(
            address(this), router, tokenIn, amountIn
        );
        require(result.allowed, result.reason);

        // Approve router to spend tokenIn
        IERC20(tokenIn).approve(router, amountIn);

        // Record balance before swap
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));

        // Call router (generic swap interface — works with Uniswap-style routers)
        // The actual swap calldata must be crafted by the SDK
        (bool success,) = router.call(
            abi.encodeWithSignature(
                "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
                amountIn,
                minAmountOut,
                _makePath(tokenIn, tokenOut),
                address(this),
                block.timestamp + 300
            )
        );
        require(success, "AgentWallet: swap failed");

        uint256 amountOut = IERC20(tokenOut).balanceOf(address(this)) - balanceBefore;
        require(amountOut >= minAmountOut, "AgentWallet: insufficient output");

        policyRegistry.recordSpend(address(this), amountIn);

        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut);
    }

    function batchPay(
        address[] calldata tos,
        address[] calldata tokens,
        uint256[] calldata amounts
    ) external onlyAgent nonReentrant {
        require(
            tos.length == tokens.length && tokens.length == amounts.length,
            "AgentWallet: array length mismatch"
        );
        require(tos.length <= 20, "AgentWallet: batch too large");

        for (uint256 i = 0; i < tos.length; i++) {
            uint256 usdValue = amounts[i];

            IPolicyRegistry.CheckResult memory result = policyRegistry.checkTransaction(
                address(this), tos[i], tokens[i], usdValue
            );

            require(result.allowed && !result.needsApproval, "AgentWallet: batch item rejected");

            _transferToken(tokens[i], tos[i], amounts[i]);
            policyRegistry.recordSpend(address(this), usdValue);

            emit PaymentExecuted(tos[i], tokens[i], amounts[i], bytes32(0));
        }
    }

    // --- Owner Actions ---

    function approveRequest(uint256 requestId) external onlyOwner nonReentrant {
        IApprovalQueue.ApprovalRequest memory req = approvalQueue.getRequest(requestId);
        require(req.wallet == address(this), "AgentWallet: wrong wallet");

        approvalQueue.approveRequest(requestId);

        // Execute the approved transaction
        _transferToken(req.token, req.to, req.amount);
        policyRegistry.recordSpend(address(this), req.amount);

        emit PaymentExecuted(req.to, req.token, req.amount, req.memo);
    }

    function denyRequest(uint256 requestId) external onlyOwner {
        approvalQueue.denyRequest(requestId);
    }

    function updatePolicy(bytes calldata policyData) external onlyOwner {
        IPolicyRegistry.Policy memory policy = abi.decode(policyData, (IPolicyRegistry.Policy));
        policyRegistry.setPolicy(address(this), policy);
        emit PolicyUpdated(keccak256(policyData));
    }

    function setAgent(address newAgent) external onlyOwner {
        _agent = newAgent;
        _agentActive = true;
        emit AgentSet(newAgent);
    }

    function revokeAgent() external onlyOwner {
        emit AgentRevoked(_agent);
        _agentActive = false;
    }

    function emergencyWithdraw(address token) external onlyOwner nonReentrant {
        if (token == address(0)) {
            // Withdraw native ETH/BNB
            uint256 balance = address(this).balance;
            require(balance > 0, "AgentWallet: no ETH balance");
            (bool success,) = _owner.call{ value: balance }("");
            require(success, "AgentWallet: ETH transfer failed");
            emit EmergencyWithdraw(token, balance);
        } else {
            // Withdraw ERC-20
            uint256 balance = IERC20(token).balanceOf(address(this));
            require(balance > 0, "AgentWallet: no token balance");
            IERC20(token).transfer(_owner, balance);
            emit EmergencyWithdraw(token, balance);
        }
    }

    // --- View Functions ---

    function owner() external view returns (address) {
        return _owner;
    }

    function agent() external view returns (address) {
        return _agent;
    }

    function isAgentActive() external view returns (bool) {
        return _agentActive;
    }

    function dailySpent() external view returns (uint256) {
        return policyRegistry.dailySpent(address(this));
    }

    function pendingRequestCount() external view returns (uint256) {
        return approvalQueue.pendingCount(address(this));
    }

    // --- Internal ---

    function _transferToken(address token, address to, uint256 amount) internal {
        if (token == address(0)) {
            // Native ETH/BNB
            (bool success,) = to.call{ value: amount }("");
            require(success, "AgentWallet: ETH transfer failed");
        } else {
            // ERC-20
            bool success = IERC20(token).transfer(to, amount);
            require(success, "AgentWallet: token transfer failed");
        }
    }

    function _makePath(address tokenIn, address tokenOut) internal pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        return path;
    }

    // Allow receiving ETH
    receive() external payable {}
}
