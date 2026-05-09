use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("9hFDdjtxZPGe3fnA2wbpAZwXDmqjLYFFhjVXsv1obv1W");

#[program]
pub mod tcg_marketplace {
    use super::*;

    pub fn list(ctx: Context<List>, price: u64) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        listing.seller = ctx.accounts.seller.key();
        listing.mint = ctx.accounts.nft_mint.key();
        listing.price = price;
        listing.bump = ctx.bumps.listing;

        // Transfer NFT from seller to program-owned Escrow account
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                Transfer {
                    from: ctx.accounts.seller_nft_token_account.to_account_info(),
                    to: ctx.accounts.escrow_nft_token_account.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            1,
        )?;
        Ok(())
    }

    pub fn buy(ctx: Context<Buy>) -> Result<()> {
        // 1. Transfer SOL from buyer to seller
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.buyer.key(),
                &ctx.accounts.seller.key(),
                ctx.accounts.listing.price,
            ),
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.seller.to_account_info(),
            ],
        )?;

        // 2. Transfer NFT from Escrow to Buyer
        let seeds = &[
            b"listing",
            ctx.accounts.listing.mint.as_ref(),
            &[ctx.accounts.listing.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                Transfer {
                    from: ctx.accounts.escrow_nft_token_account.to_account_info(),
                    to: ctx.accounts.buyer_nft_token_account.to_account_info(),
                    authority: ctx.accounts.listing.to_account_info(),
                },
                signer,
            ),
            1,
        )?;
        Ok(())
    }

    pub fn delist(ctx: Context<Delist>) -> Result<()> {
        let seeds = &[
            b"listing",
            ctx.accounts.listing.mint.as_ref(),
            &[ctx.accounts.listing.bump],
        ];
        let signer = &[&seeds[..]];

        // Return NFT to seller
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                Transfer {
                    from: ctx.accounts.escrow_nft_token_account.to_account_info(),
                    to: ctx.accounts.seller_nft_token_account.to_account_info(),
                    authority: ctx.accounts.listing.to_account_info(),
                },
                signer,
            ),
            1,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct List<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    pub nft_mint: Account<'info, anchor_spl::token::Mint>,
    #[account(mut)]
    pub seller_nft_token_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = seller,
        space = 8 + 32 + 32 + 8 + 1,
        seeds = [b"listing", nft_mint.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        init,
        payer = seller,
        token::mint = nft_mint,
        token::authority = listing,
    )]
    pub escrow_nft_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: Seller gets the money
    #[account(mut)]
    pub seller: UncheckedAccount<'info>,
    #[account(
        mut,
        has_one = seller,
        close = seller,
        seeds = [b"listing", listing.mint.as_ref()],
        bump = listing.bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(mut)]
    pub escrow_nft_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer_nft_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Delist<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        mut,
        has_one = seller,
        close = seller,
        seeds = [b"listing", listing.mint.as_ref()],
        bump = listing.bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(mut)]
    pub escrow_nft_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller_nft_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Listing {
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub price: u64,
    pub bump: u8,
}