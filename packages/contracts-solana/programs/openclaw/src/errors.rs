use anchor_lang::prelude::*;

#[error_code]
pub enum PayClawError {
    #[msg("Not the wallet owner")]
    NotOwner,
    #[msg("Not the active agent")]
    NotAgent,
    #[msg("Agent has been revoked")]
    AgentRevoked,
    #[msg("Exceeds per-transaction limit")]
    ExceedsPerTxLimit,
    #[msg("Exceeds daily spending limit")]
    ExceedsDailyLimit,
    #[msg("Cooldown period active")]
    CooldownActive,
    #[msg("Token not in allowlist")]
    TokenNotAllowed,
    #[msg("Recipient not in allowlist")]
    RecipientNotAllowed,
    #[msg("Maximum pending approvals reached")]
    MaxPendingApprovals,
    #[msg("Approval request not found")]
    ApprovalNotFound,
    #[msg("Approval request expired")]
    ApprovalExpired,
    #[msg("Insufficient balance")]
    InsufficientBalance,
}
