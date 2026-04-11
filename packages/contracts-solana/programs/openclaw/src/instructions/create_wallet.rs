use anchor_lang::prelude::*;
use crate::state::{AgentWallet, Policy};

#[derive(Accounts)]
pub struct CreateWallet<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = AgentWallet::LEN,
        seeds = [b"wallet", owner.key().as_ref()],
        bump,
    )]
    pub wallet: Account<'info, AgentWallet>,

    #[account(
        init,
        payer = owner,
        space = Policy::LEN,
        seeds = [b"policy", wallet.key().as_ref()],
        bump,
    )]
    pub policy: Account<'info, Policy>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateWallet>,
    agent: Pubkey,
    daily_limit: u64,
    per_tx_limit: u64,
    approval_threshold: u64,
) -> Result<()> {
    let wallet = &mut ctx.accounts.wallet;
    wallet.owner = ctx.accounts.owner.key();
    wallet.agent = agent;
    wallet.agent_active = true;
    wallet.bump = ctx.bumps.wallet;
    wallet.created_at = Clock::get()?.unix_timestamp;
    wallet.last_reset_timestamp = Clock::get()?.unix_timestamp;

    let policy = &mut ctx.accounts.policy;
    policy.wallet = wallet.key();
    policy.daily_limit = daily_limit;
    policy.per_tx_limit = per_tx_limit;
    policy.approval_threshold = approval_threshold;
    policy.swaps_enabled = true;
    policy.cooldown_seconds = 0;
    policy.bump = ctx.bumps.policy;

    Ok(())
}
