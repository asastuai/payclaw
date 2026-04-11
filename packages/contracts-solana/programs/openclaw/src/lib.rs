use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod errors;

use instructions::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod payclaw {
    use super::*;

    pub fn create_wallet(
        ctx: Context<CreateWallet>,
        agent: Pubkey,
        daily_limit: u64,
        per_tx_limit: u64,
        approval_threshold: u64,
    ) -> Result<()> {
        instructions::create_wallet::handler(ctx, agent, daily_limit, per_tx_limit, approval_threshold)
    }

    pub fn pay(
        ctx: Context<Pay>,
        amount: u64,
        memo: [u8; 32],
    ) -> Result<()> {
        instructions::pay::handler(ctx, amount, memo)
    }

    pub fn approve_request(
        ctx: Context<ApproveRequest>,
        request_id: u64,
    ) -> Result<()> {
        instructions::approve::handler(ctx, request_id)
    }

    pub fn deny_request(
        ctx: Context<DenyRequest>,
        request_id: u64,
    ) -> Result<()> {
        instructions::deny::handler(ctx, request_id)
    }

    pub fn update_policy(
        ctx: Context<UpdatePolicy>,
        daily_limit: u64,
        per_tx_limit: u64,
        approval_threshold: u64,
    ) -> Result<()> {
        instructions::update_policy::handler(ctx, daily_limit, per_tx_limit, approval_threshold)
    }

    pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>) -> Result<()> {
        instructions::emergency_withdraw::handler(ctx)
    }
}
