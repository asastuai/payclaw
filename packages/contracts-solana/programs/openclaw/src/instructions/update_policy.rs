use anchor_lang::prelude::*;
use crate::state::{AgentWallet, Policy};

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"wallet", wallet.owner.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key(),
    )]
    pub wallet: Account<'info, AgentWallet>,

    #[account(
        mut,
        seeds = [b"policy", wallet.key().as_ref()],
        bump = policy.bump,
    )]
    pub policy: Account<'info, Policy>,
}

pub fn handler(
    ctx: Context<UpdatePolicy>,
    daily_limit: u64,
    per_tx_limit: u64,
    approval_threshold: u64,
) -> Result<()> {
    let policy = &mut ctx.accounts.policy;
    policy.daily_limit = daily_limit;
    policy.per_tx_limit = per_tx_limit;
    policy.approval_threshold = approval_threshold;
    Ok(())
}
