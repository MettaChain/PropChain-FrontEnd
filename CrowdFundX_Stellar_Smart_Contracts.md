# CrowdFundX Stellar Smart Contracts

## Overview

This document details the Stellar Soroban smart contracts for the CrowdFundX decentralized crowdfunding platform. The contracts are designed to be secure, efficient, and interoperable within the Stellar ecosystem.

## Smart Contract Architecture

### 1. Campaign Manager Contract

The core contract responsible for creating, managing, and tracking crowdfunding campaigns.

```rust
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec, Map, Uint128};

#[contract]
pub struct CampaignManager;

#[derive(Clone)]
pub struct Campaign {
    pub id: Uint128,
    pub creator: Address,
    pub title: Symbol,
    pub description: Symbol,
    pub funding_goal: Uint128,
    pub current_funding: Uint128,
    pub deadline: Uint128,
    pub status: Symbol, // "active", "successful", "failed", "cancelled"
    pub asset: Address, // Stellar asset address
    pub created_at: Uint128,
    pub reward_tiers: Vec<RewardTier>,
}

#[derive(Clone)]
pub struct RewardTier {
    pub id: Uint128,
    pub title: Symbol,
    pub description: Symbol,
    pub min_contribution: Uint128,
    pub max_backers: Uint128,
    pub current_backers: Uint128,
}

#[contractimpl]
impl CampaignManager {
    /// Create a new crowdfunding campaign
    pub fn create_campaign(
        env: Env,
        creator: Address,
        title: Symbol,
        description: Symbol,
        funding_goal: Uint128,
        deadline: Uint128,
        asset: Address,
        reward_tiers: Vec<RewardTier>,
    ) -> Uint128 {
        // Validate inputs
        creator.require_auth();
        assert!(funding_goal > 0, "Funding goal must be positive");
        assert!(deadline > env.ledger().timestamp(), "Deadline must be in future");
        
        // Generate campaign ID
        let campaign_id = Self::generate_campaign_id(&env);
        
        // Create campaign
        let campaign = Campaign {
            id: campaign_id,
            creator: creator.clone(),
            title,
            description,
            funding_goal,
            current_funding: Uint128::from(0u64),
            deadline,
            status: Symbol::new(&env, "active"),
            asset,
            created_at: env.ledger().timestamp(),
            reward_tiers,
        };
        
        // Store campaign
        let campaigns_key = Symbol::new(&env, "campaigns");
        let mut campaigns: Map<Uint128, Campaign> = env.storage().persistent().get(&campaigns_key).unwrap_or_else(|| Map::new(&env));
        campaigns.set(campaign_id, campaign);
        env.storage().persistent().set(&campaigns_key, &campaigns);
        
        // Store creator's campaigns
        let creator_key = Symbol::new(&env, "creator_campaigns");
        let mut creator_campaigns: Vec<Uint128> = env.storage().persistent().get(&creator_key).unwrap_or_else(|| Vec::new(&env));
        creator_campaigns.push_back(campaign_id);
        env.storage().persistent().set(&creator_key, &creator_campaigns);
        
        campaign_id
    }
    
    /// Get campaign details
    pub fn get_campaign(env: Env, campaign_id: Uint128) -> Campaign {
        let campaigns_key = Symbol::new(&env, "campaigns");
        let campaigns: Map<Uint128, Campaign> = env.storage().persistent().get(&campaigns_key)
            .expect("Campaign not found");
        campaigns.get(campaign_id).expect("Campaign not found")
    }
    
    /// Update campaign status
    pub fn update_campaign_status(env: Env, campaign_id: Uint128, new_status: Symbol) {
        let mut campaign = Self::get_campaign(env.clone(), campaign_id);
        campaign.creator.require_auth();
        
        campaign.status = new_status;
        
        // Update campaign in storage
        let campaigns_key = Symbol::new(&env, "campaigns");
        let mut campaigns: Map<Uint128, Campaign> = env.storage().persistent().get(&campaigns_key).unwrap();
        campaigns.set(campaign_id, campaign);
        env.storage().persistent().set(&campaigns_key, &campaigns);
    }
    
    /// Check if campaign deadline has passed
    pub fn check_campaign_deadline(env: Env, campaign_id: Uint128) {
        let mut campaign = Self::get_campaign(env.clone(), campaign_id);
        
        if env.ledger().timestamp() > campaign.deadline {
            if campaign.current_funding >= campaign.funding_goal {
                campaign.status = Symbol::new(&env, "successful");
            } else {
                campaign.status = Symbol::new(&env, "failed");
            }
            
            // Update campaign in storage
            let campaigns_key = Symbol::new(&env, "campaigns");
            let mut campaigns: Map<Uint128, Campaign> = env.storage().persistent().get(&campaigns_key).unwrap();
            campaigns.set(campaign_id, campaign);
            env.storage().persistent().set(&campaigns_key, &campaigns);
        }
    }
    
    /// Generate unique campaign ID
    fn generate_campaign_id(env: &Env) -> Uint128 {
        let counter_key = Symbol::new(env, "campaign_counter");
        let counter: Uint128 = env.storage().persistent().get(&counter_key).unwrap_or_else(|| Uint128::from(0u64));
        let new_counter = counter + Uint128::from(1u64);
        env.storage().persistent().set(&counter_key, &new_counter);
        new_counter
    }
}
```

### 2. Funding Pool Contract

Handles all financial operations including contributions, refunds, and fund withdrawals.

```rust
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec, Map, Uint128};

#[contract]
pub struct FundingPool;

#[derive(Clone)]
pub struct Contribution {
    pub id: Uint128,
    pub campaign_id: Uint128,
    pub contributor: Address,
    pub amount: Uint128,
    pub asset: Address,
    pub transaction_hash: Symbol,
    pub timestamp: Uint128,
    pub refund_claimed: bool,
}

#[contractimpl]
impl FundingPool {
    /// Contribute to a campaign
    pub fn contribute(
        env: Env,
        campaign_id: Uint128,
        contributor: Address,
        amount: Uint128,
        asset: Address,
    ) -> Uint128 {
        contributor.require_auth();
        
        // Validate campaign is active
        let campaign = CampaignManager::get_campaign(env.clone(), campaign_id);
        assert!(campaign.status == Symbol::new(&env, "active"), "Campaign is not active");
        assert!(env.ledger().timestamp() <= campaign.deadline, "Campaign deadline has passed");
        assert!(asset == campaign.asset, "Invalid asset type");
        
        // Create contribution record
        let contribution_id = Self::generate_contribution_id(&env);
        let contribution = Contribution {
            id: contribution_id,
            campaign_id,
            contributor: contributor.clone(),
            amount,
            asset,
            transaction_hash: Symbol::new(&env, "pending"), // Will be set after transaction
            timestamp: env.ledger().timestamp(),
            refund_claimed: false,
        };
        
        // Store contribution
        let contributions_key = Symbol::new(&env, "contributions");
        let mut contributions: Map<Uint128, Contribution> = env.storage().persistent().get(&contributions_key)
            .unwrap_or_else(|| Map::new(&env));
        contributions.set(contribution_id, contribution);
        env.storage().persistent().set(&contributions_key, &contributions);
        
        // Update campaign funding
        let campaigns_key = Symbol::new(&env, "campaigns");
        let mut campaigns: Map<Uint128, Campaign> = env.storage().persistent().get(&campaigns_key).unwrap();
        let mut campaign = campaigns.get(campaign_id).unwrap();
        campaign.current_funding += amount;
        campaigns.set(campaign_id, campaign);
        env.storage().persistent().set(&campaigns_key, &campaigns);
        
        // Store contributor's contributions
        let contributor_key = Symbol::new(&env, &format!("contributor_{}", contributor));
        let mut contributor_contributions: Vec<Uint128> = env.storage().persistent().get(&contributor_key)
            .unwrap_or_else(|| Vec::new(&env));
        contributor_contributions.push_back(contribution_id);
        env.storage().persistent().set(&contributor_key, &contributor_contributions);
        
        contribution_id
    }
    
    /// Withdraw funds for successful campaign
    pub fn withdraw_funds(env: Env, campaign_id: Uint128, amount: Uint128) {
        let campaign = CampaignManager::get_campaign(env.clone(), campaign_id);
        campaign.creator.require_auth();
        
        assert!(campaign.status == Symbol::new(&env, "successful"), "Campaign is not successful");
        assert!(amount <= campaign.current_funding, "Insufficient funds available");
        
        // Calculate available funds (subtract already withdrawn)
        let withdrawn_key = Symbol::new(&env, &format!("withdrawn_{}", campaign_id));
        let already_withdrawn: Uint128 = env.storage().persistent().get(&withdrawn_key)
            .unwrap_or_else(|| Uint128::from(0u64));
        
        assert!(amount <= (campaign.current_funding - already_withdrawn), "Insufficient available funds");
        
        // Update withdrawn amount
        let new_withdrawn = already_withdrawn + amount;
        env.storage().persistent().set(&withdrawn_key, &new_withdrawn);
        
        // Emit withdrawal event
        env.events().publish(
            Symbol::new(&env, "fund_withdrawal"),
            (campaign_id, campaign.creator, amount),
        );
    }
    
    /// Claim refund for failed campaign
    pub fn claim_refund(env: Env, contribution_id: Uint128) {
        let contributions_key = Symbol::new(&env, "contributions");
        let mut contributions: Map<Uint128, Contribution> = env.storage().persistent().get(&contributions_key).unwrap();
        let mut contribution = contributions.get(contribution_id).expect("Contribution not found");
        
        contribution.contributor.require_auth();
        assert!(!contribution.refund_claimed, "Refund already claimed");
        
        // Check campaign status
        let campaign = CampaignManager::get_campaign(env.clone(), contribution.campaign_id);
        assert!(campaign.status == Symbol::new(&env, "failed"), "Campaign did not fail");
        
        // Mark refund as claimed
        contribution.refund_claimed = true;
        contributions.set(contribution_id, contribution);
        env.storage().persistent().set(&contributions_key, &contributions);
        
        // Emit refund event
        env.events().publish(
            Symbol::new(&env, "refund_claimed"),
            (contribution_id, contribution.contributor, contribution.amount),
        );
    }
    
    /// Get contribution details
    pub fn get_contribution(env: Env, contribution_id: Uint128) -> Contribution {
        let contributions_key = Symbol::new(&env, "contributions");
        let contributions: Map<Uint128, Contribution> = env.storage().persistent().get(&contributions_key)
            .expect("Contributions not found");
        contributions.get(contribution_id).expect("Contribution not found")
    }
    
    /// Get all contributions for a campaign
    pub fn get_campaign_contributions(env: Env, campaign_id: Uint128) -> Vec<Contribution> {
        let contributions_key = Symbol::new(&env, "contributions");
        let contributions: Map<Uint128, Contribution> = env.storage().persistent().get(&contributions_key)
            .unwrap_or_else(|| Map::new(&env));
        
        let mut campaign_contributions = Vec::new(&env);
        for (_, contribution) in contributions.iter() {
            if contribution.campaign_id == campaign_id {
                campaign_contributions.push_back(contribution);
            }
        }
        campaign_contributions
    }
    
    /// Generate unique contribution ID
    fn generate_contribution_id(env: &Env) -> Uint128 {
        let counter_key = Symbol::new(env, "contribution_counter");
        let counter: Uint128 = env.storage().persistent().get(&counter_key).unwrap_or_else(|| Uint128::from(0u64));
        let new_counter = counter + Uint128::from(1u64);
        env.storage().persistent().set(&counter_key, &new_counter);
        new_counter
    }
}
```

### 3. Reward System Contract

Manages reward tiers, distribution, and claiming for campaign contributors.

```rust
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec, Map, Uint128};

#[contract]
pub struct RewardSystem;

#[derive(Clone)]
pub struct RewardClaim {
    pub id: Uint128,
    pub campaign_id: Uint128,
    pub contributor: Address,
    pub reward_tier_id: Uint128,
    pub claimed: bool,
    pub claimed_at: Uint128,
}

#[contractimpl]
impl RewardSystem {
    /// Claim reward for contribution
    pub fn claim_reward(
        env: Env,
        campaign_id: Uint128,
        contributor: Address,
        reward_tier_id: Uint128,
    ) {
        contributor.require_auth();
        
        // Get campaign and validate
        let campaign = CampaignManager::get_campaign(env.clone(), campaign_id);
        assert!(campaign.status == Symbol::new(&env, "successful"), "Campaign is not successful");
        
        // Check if contributor is eligible
        let contributions = FundingPool::get_campaign_contributions(env.clone(), campaign_id);
        let total_contribution = Self::calculate_total_contribution(&contributions, &contributor);
        
        // Find reward tier
        let reward_tier = Self::find_reward_tier(&campaign, reward_tier_id);
        assert!(total_contribution >= reward_tier.min_contribution, "Insufficient contribution for this reward tier");
        assert!(reward_tier.current_backers < reward_tier.max_backers, "Reward tier is full");
        
        // Check if already claimed
        let claim_key = Symbol::new(&env, &format!("claim_{}_{}_{}", campaign_id, contributor, reward_tier_id));
        let already_claimed: bool = env.storage().persistent().get(&claim_key).unwrap_or(false);
        assert!(!already_claimed, "Reward already claimed");
        
        // Mark as claimed
        env.storage().persistent().set(&claim_key, &true);
        
        // Update reward tier backers count
        Self::update_reward_tier_backers(env.clone(), campaign_id, reward_tier_id);
        
        // Create reward claim record
        let claim_id = Self::generate_claim_id(&env);
        let reward_claim = RewardClaim {
            id: claim_id,
            campaign_id,
            contributor,
            reward_tier_id,
            claimed: true,
            claimed_at: env.ledger().timestamp(),
        };
        
        // Store claim
        let claims_key = Symbol::new(&env, "reward_claims");
        let mut claims: Map<Uint128, RewardClaim> = env.storage().persistent().get(&claims_key)
            .unwrap_or_else(|| Map::new(&env));
        claims.set(claim_id, reward_claim);
        env.storage().persistent().set(&claims_key, &claims);
        
        // Emit reward claimed event
        env.events().publish(
            Symbol::new(&env, "reward_claimed"),
            (campaign_id, contributor, reward_tier_id),
        );
    }
    
    /// Get available rewards for contributor
    pub fn get_available_rewards(env: Env, campaign_id: Uint128, contributor: Address) -> Vec<RewardTier> {
        let campaign = CampaignManager::get_campaign(env.clone(), campaign_id);
        let contributions = FundingPool::get_campaign_contributions(env.clone(), campaign_id);
        let total_contribution = Self::calculate_total_contribution(&contributions, &contributor);
        
        let mut available_rewards = Vec::new(&env);
        
        for reward_tier in campaign.reward_tiers.iter() {
            if total_contribution >= reward_tier.min_contribution && 
               reward_tier.current_backers < reward_tier.max_backers {
                
                // Check if already claimed
                let claim_key = Symbol::new(&env, &format!("claim_{}_{}_{}", campaign_id, contributor, reward_tier.id));
                let already_claimed: bool = env.storage().persistent().get(&claim_key).unwrap_or(false);
                
                if !already_claimed {
                    available_rewards.push_back(reward_tier.clone());
                }
            }
        }
        
        available_rewards
    }
    
    /// Calculate total contribution for a contributor in a campaign
    fn calculate_total_contribution(contributions: &Vec<Contribution>, contributor: &Address) -> Uint128 {
        let mut total = Uint128::from(0u64);
        for contribution in contributions.iter() {
            if contribution.contributor == *contributor {
                total += contribution.amount;
            }
        }
        total
    }
    
    /// Find reward tier by ID
    fn find_reward_tier(campaign: &Campaign, reward_tier_id: Uint128) -> RewardTier {
        for reward_tier in campaign.reward_tiers.iter() {
            if reward_tier.id == reward_tier_id {
                return reward_tier.clone();
            }
        }
        panic!("Reward tier not found");
    }
    
    /// Update reward tier backers count
    fn update_reward_tier_backers(env: Env, campaign_id: Uint128, reward_tier_id: Uint128) {
        let campaigns_key = Symbol::new(&env, "campaigns");
        let mut campaigns: Map<Uint128, Campaign> = env.storage().persistent().get(&campaigns_key).unwrap();
        let mut campaign = campaigns.get(campaign_id).unwrap();
        
        // Find and update the reward tier
        for mut reward_tier in campaign.reward_tiers.iter_mut() {
            if reward_tier.id == reward_tier_id {
                reward_tier.current_backers += Uint128::from(1u64);
                break;
            }
        }
        
        campaigns.set(campaign_id, campaign);
        env.storage().persistent().set(&campaigns_key, &campaigns);
    }
    
    /// Generate unique claim ID
    fn generate_claim_id(env: &Env) -> Uint128 {
        let counter_key = Symbol::new(env, "claim_counter");
        let counter: Uint128 = env.storage().persistent().get(&counter_key).unwrap_or_else(|| Uint128::from(0u64));
        let new_counter = counter + Uint128::from(1u64);
        env.storage().persistent().set(&counter_key, &new_counter);
        new_counter
    }
}
```

### 4. Governance Contract

Implements voting mechanisms for campaign-related decisions and platform governance.

```rust
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec, Map, Uint128};

#[contract]
pub struct Governance;

#[derive(Clone)]
pub struct Proposal {
    pub id: Uint128,
    pub campaign_id: Uint128, // 0 for platform-level proposals
    pub proposer: Address,
    pub title: Symbol,
    pub description: Symbol,
    pub proposal_type: Symbol, // "milestone_release", "campaign_extension", "platform_change"
    pub voting_deadline: Uint128,
    pub yes_votes: Uint128,
    pub no_votes: Uint128,
    pub total_voting_power: Uint128,
    pub executed: bool,
    pub created_at: Uint128,
}

#[derive(Clone)]
pub struct Vote {
    pub proposal_id: Uint128,
    pub voter: Address,
    pub choice: Symbol, // "yes", "no"
    pub voting_power: Uint128,
    pub timestamp: Uint128,
}

#[contractimpl]
impl Governance {
    /// Create a new proposal
    pub fn create_proposal(
        env: Env,
        campaign_id: Uint128,
        proposer: Address,
        title: Symbol,
        description: Symbol,
        proposal_type: Symbol,
        voting_deadline: Uint128,
    ) -> Uint128 {
        proposer.require_auth();
        assert!(voting_deadline > env.ledger().timestamp(), "Voting deadline must be in future");
        
        // For campaign-specific proposals, validate proposer is campaign creator
        if campaign_id != Uint128::from(0u64) {
            let campaign = CampaignManager::get_campaign(env.clone(), campaign_id);
            assert!(campaign.creator == proposer, "Only campaign creator can create proposals");
        }
        
        let proposal_id = Self::generate_proposal_id(&env);
        let proposal = Proposal {
            id: proposal_id,
            campaign_id,
            proposer: proposer.clone(),
            title,
            description,
            proposal_type,
            voting_deadline,
            yes_votes: Uint128::from(0u64),
            no_votes: Uint128::from(0u64),
            total_voting_power: Uint128::from(0u64),
            executed: false,
            created_at: env.ledger().timestamp(),
        };
        
        // Store proposal
        let proposals_key = Symbol::new(&env, "proposals");
        let mut proposals: Map<Uint128, Proposal> = env.storage().persistent().get(&proposals_key)
            .unwrap_or_else(|| Map::new(&env));
        proposals.set(proposal_id, proposal);
        env.storage().persistent().set(&proposals_key, &proposals);
        
        proposal_id
    }
    
    /// Vote on a proposal
    pub fn vote(env: Env, proposal_id: Uint128, voter: Address, choice: Symbol) {
        voter.require_auth();
        assert!(choice == Symbol::new(&env, "yes") || choice == Symbol::new(&env, "no"), "Invalid choice");
        
        // Get proposal and validate voting period
        let mut proposal = Self::get_proposal(env.clone(), proposal_id);
        assert!(env.ledger().timestamp() <= proposal.voting_deadline, "Voting period has ended");
        assert!(!proposal.executed, "Proposal already executed");
        
        // Check if already voted
        let vote_key = Symbol::new(&env, &format!("vote_{}_{}", proposal_id, voter));
        let already_voted: bool = env.storage().persistent().get(&vote_key).unwrap_or(false);
        assert!(!already_voted, "Already voted on this proposal");
        
        // Calculate voting power based on contributions
        let voting_power = Self::calculate_voting_power(env.clone(), proposal.campaign_id, &voter);
        assert!(voting_power > 0, "No voting power");
        
        // Mark as voted
        env.storage().persistent().set(&vote_key, &true);
        
        // Update proposal vote counts
        if choice == Symbol::new(&env, "yes") {
            proposal.yes_votes += voting_power;
        } else {
            proposal.no_votes += voting_power;
        }
        proposal.total_voting_power += voting_power;
        
        // Store updated proposal
        let proposals_key = Symbol::new(&env, "proposals");
        let mut proposals: Map<Uint128, Proposal> = env.storage().persistent().get(&proposals_key).unwrap();
        proposals.set(proposal_id, proposal.clone());
        env.storage().persistent().set(&proposals_key, &proposals);
        
        // Store vote record
        let vote = Vote {
            proposal_id,
            voter,
            choice,
            voting_power,
            timestamp: env.ledger().timestamp(),
        };
        
        let votes_key = Symbol::new(&env, "votes");
        let mut votes: Map<Symbol, Vote> = env.storage().persistent().get(&votes_key)
            .unwrap_or_else(|| Map::new(&env));
        votes.set(Symbol::new(&env, &format!("{}_{}", proposal_id, voter)), vote);
        env.storage().persistent().set(&votes_key, &votes);
        
        // Emit vote event
        env.events().publish(
            Symbol::new(&env, "vote_cast"),
            (proposal_id, voter, choice, voting_power),
        );
    }
    
    /// Execute proposal if voting period has ended and it passed
    pub fn execute_proposal(env: Env, proposal_id: Uint128) {
        let mut proposal = Self::get_proposal(env.clone(), proposal_id);
        assert!(env.ledger().timestamp() > proposal.voting_deadline, "Voting period has not ended");
        assert!(!proposal.executed, "Proposal already executed");
        
        // Check if proposal passed (simple majority)
        let passed = proposal.yes_votes > proposal.no_votes;
        assert!(passed, "Proposal did not pass");
        
        proposal.executed = true;
        
        // Store updated proposal
        let proposals_key = Symbol::new(&env, "proposals");
        let mut proposals: Map<Uint128, Proposal> = env.storage().persistent().get(&proposals_key).unwrap();
        proposals.set(proposal_id, proposal);
        env.storage().persistent().set(&proposals_key, &proposals);
        
        // Execute proposal logic based on type
        Self::execute_proposal_logic(env.clone(), &proposal);
        
        // Emit execution event
        env.events().publish(
            Symbol::new(&env, "proposal_executed"),
            (proposal_id, proposal.proposal_type),
        );
    }
    
    /// Get proposal details
    pub fn get_proposal(env: Env, proposal_id: Uint128) -> Proposal {
        let proposals_key = Symbol::new(&env, "proposals");
        let proposals: Map<Uint128, Proposal> = env.storage().persistent().get(&proposals_key)
            .expect("Proposals not found");
        proposals.get(proposal_id).expect("Proposal not found")
    }
    
    /// Calculate voting power for a contributor
    fn calculate_voting_power(env: Env, campaign_id: Uint128, contributor: &Address) -> Uint128 {
        if campaign_id == Uint128::from(0u64) {
            // Platform-level voting - could be based on platform token holdings
            return Uint128::from(1u64); // Simplified: 1 vote per user
        }
        
        // Campaign-level voting based on contribution amount
        let contributions = FundingPool::get_campaign_contributions(env, campaign_id);
        let mut total_contribution = Uint128::from(0u64);
        
        for contribution in contributions.iter() {
            if contribution.contributor == *contributor {
                total_contribution += contribution.amount;
            }
        }
        
        // 1 voting power per unit of contribution (could be adjusted)
        total_contribution
    }
    
    /// Execute specific proposal logic
    fn execute_proposal_logic(env: Env, proposal: &Proposal) {
        match proposal.proposal_type.to_string().as_str() {
            "milestone_release" => {
                // Logic to release milestone funds
                // This would interact with FundingPool contract
            },
            "campaign_extension" => {
                // Logic to extend campaign deadline
                // This would interact with CampaignManager contract
            },
            "platform_change" => {
                // Logic for platform-level changes
                // Could update platform parameters
            },
            _ => {
                panic!("Unknown proposal type");
            }
        }
    }
    
    /// Generate unique proposal ID
    fn generate_proposal_id(env: &Env) -> Uint128 {
        let counter_key = Symbol::new(env, "proposal_counter");
        let counter: Uint128 = env.storage().persistent().get(&counter_key).unwrap_or_else(|| Uint128::from(0u64));
        let new_counter = counter + Uint128::from(1u64);
        env.storage().persistent().set(&counter_key, &new_counter);
        new_counter
    }
}
```

## Contract Deployment and Integration

### Deployment Script

```javascript
const { SorobanRpc } = require('@stellar/stellar-sdk');
const { Contract } = require('@stellar/stellar-sdk');

async function deployContracts() {
    const server = new SorobanRpc.Server('https://horizon-testnet.stellar.org');
    const sourceKeypair = Keypair.fromSecret('your-secret-key');
    
    // Deploy Campaign Manager
    const campaignManagerContract = new Contract({
        source: 'campaign_manager.wasm'
    });
    
    // Deploy Funding Pool
    const fundingPoolContract = new Contract({
        source: 'funding_pool.wasm'
    });
    
    // Deploy Reward System
    const rewardSystemContract = new Contract({
        source: 'reward_system.wasm'
    });
    
    // Deploy Governance
    const governanceContract = new Contract({
        source: 'governance.wasm'
    });
    
    // Store contract addresses for integration
    const contractAddresses = {
        campaignManager: campaignManagerContract.contractId(),
        fundingPool: fundingPoolContract.contractId(),
        rewardSystem: rewardSystemContract.contractId(),
        governance: governanceContract.contractId()
    };
    
    console.log('Contracts deployed:', contractAddresses);
    return contractAddresses;
}
```

### Integration Example

```javascript
// Frontend integration example
class CrowdFundXSDK {
    constructor(contractAddresses, serverUrl) {
        this.contracts = contractAddresses;
        this.server = new SorobanRpc.Server(serverUrl);
    }
    
    async createCampaign(creator, title, description, goal, deadline, asset) {
        const contract = new Contract(this.contracts.campaignManager);
        const operation = contract.call(
            'create_campaign',
            creator,
            title,
            description,
            goal,
            deadline,
            asset
        );
        
        return await this.submitTransaction(operation);
    }
    
    async contribute(campaignId, contributor, amount, asset) {
        const contract = new Contract(this.contracts.fundingPool);
        const operation = contract.call(
            'contribute',
            campaignId,
            contributor,
            amount,
            asset
        );
        
        return await this.submitTransaction(operation);
    }
    
    async submitTransaction(operation) {
        // Build and submit transaction to Stellar network
        // Handle transaction signing and submission
        // Return transaction result
    }
}
```

## Security Considerations

### Access Control
- Proper authentication using `require_auth()`
- Role-based permissions for different operations
- Multi-signature support for critical operations

### Input Validation
- Comprehensive input validation for all parameters
- Bounds checking for numerical values
- Address validation for Stellar addresses

### Reentrancy Protection
- State updates before external calls
- Reentrancy guards for critical functions
- Proper error handling and rollback mechanisms

### Emergency Controls
- Pause functionality for emergency situations
- Circuit breakers for unusual activity
- Admin override capabilities with proper governance

## Testing Strategy

### Unit Tests
- Test individual contract functions
- Verify edge cases and error conditions
- Validate state transitions

### Integration Tests
- Test contract interactions
- Verify end-to-end workflows
- Test with realistic data volumes

### Security Audits
- Professional security audit
- Penetration testing
- Formal verification for critical functions

## Gas Optimization

### Storage Optimization
- Efficient data structures
- Minimal storage usage
- Lazy loading patterns

### Computation Optimization
- Efficient algorithms
- Minimal loop iterations
- Optimized mathematical operations

### Batch Operations
- Support for batch contributions
- Bulk reward claiming
- Batch proposal voting

This comprehensive smart contract system provides a robust foundation for the CrowdFundX platform on Stellar, ensuring security, efficiency, and user-friendly crowdfunding functionality.
