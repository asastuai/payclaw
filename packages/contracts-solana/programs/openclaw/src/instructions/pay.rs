use anchor_lang::prelude::*;
use crate::state::AgentWallet;

#[derive(Accounts)]
pub struct Pay<'info> {
    pub agent: Signer<'info>,

    #[account(
        mut,
        seeds = [b"wallet", wallet.owner.as_ref()],
        bump = wallet.bump,
        constraint = wallet.agent == agent.key(),
        constraint = wallet.agent_active,
    )]
    pub wallet: Account<'info, AgentWallet>,
    // TODO Phase 3: Add token accounts, recipient, policy, etc.
}

pub fn handler(
    _ctx: Context<Pay>,
    _amount: u64,
    _memo: [u8; 32],
) -> Result<()> {
    // TODO Phase 3: Implement payment with policy checks
    msg!("pay() stub — not yet implemented");
    Ok(())
}
