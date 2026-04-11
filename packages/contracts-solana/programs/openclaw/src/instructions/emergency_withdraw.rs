use anchor_lang::prelude::*;
use crate::state::AgentWallet;

#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"wallet", wallet.owner.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key(),
    )]
    pub wallet: Account<'info, AgentWallet>,
    // TODO Phase 3: Add token accounts for withdrawal
}

pub fn handler(
    _ctx: Context<EmergencyWithdraw>,
) -> Result<()> {
    msg!("emergency_withdraw() stub — not yet implemented");
    Ok(())
}
