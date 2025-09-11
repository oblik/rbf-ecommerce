import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Contributed,
  FundingGoalReached,
  RevenueShared,
  ReturnsWithdrawn,
  RepaymentCompleted
} from "../generated/templates/RBFCampaign/RBFCampaign"
import { Campaign, Contribution, Investor, Business, Factory } from "../generated/schema"

export function handleContributed(event: Contributed): void {
  let campaignId = event.address.toHexString()
  let campaign = Campaign.load(campaignId)
  
  if (!campaign) {
    return
  }
  
  // Update campaign
  campaign.totalFunded = campaign.totalFunded.plus(event.params.amount)
  campaign.contributionCount = campaign.contributionCount + 1
  
  // Get or create investor
  let investor = Investor.load(event.params.contributor.toHexString())
  if (!investor) {
    investor = new Investor(event.params.contributor.toHexString())
    investor.totalInvested = BigInt.fromI32(0)
    investor.totalReturns = BigInt.fromI32(0)
    investor.campaigns = []
    investor.activeInvestments = 0
  }
  
  // Add campaign to investor if not already there
  let campaigns = investor.campaigns
  if (campaigns.indexOf(campaignId) == -1) {
    campaigns.push(campaignId)
    investor.campaigns = campaigns
    investor.activeInvestments = investor.activeInvestments + 1
    campaign.investorCount = campaign.investorCount + 1
  }
  
  investor.totalInvested = investor.totalInvested.plus(event.params.amount)
  investor.save()
  
  // Create contribution
  let contributionId = campaignId + "-" + event.params.contributor.toHexString() + "-" + event.block.timestamp.toString()
  let contribution = new Contribution(contributionId)
  contribution.campaign = campaignId
  contribution.investor = event.params.contributor.toHexString()
  contribution.amount = event.params.amount
  contribution.timestamp = event.block.timestamp
  contribution.transactionHash = event.transaction.hash.toHexString()
  contribution.save()
  
  // Update business
  let business = Business.load(campaign.business)
  if (business) {
    business.totalRaised = business.totalRaised.plus(event.params.amount)
    business.save()
  }
  
  // Update factory
  let factory = Factory.load("1")
  if (factory) {
    factory.totalRaised = factory.totalRaised.plus(event.params.amount)
    factory.save()
  }
  
  campaign.save()
}

export function handleFundingGoalReached(event: FundingGoalReached): void {
  let campaign = Campaign.load(event.address.toHexString())
  if (!campaign) {
    return
  }
  
  campaign.fundingActive = false
  campaign.repaymentActive = true
  campaign.save()
}

export function handleRevenueShared(event: RevenueShared): void {
  let campaign = Campaign.load(event.address.toHexString())
  if (!campaign) {
    return
  }
  
  campaign.totalRevenueShared = campaign.totalRevenueShared.plus(event.params.shareAmount)
  campaign.totalRepaid = campaign.totalRepaid.plus(event.params.shareAmount)
  campaign.save()
  
  // Update business
  let business = Business.load(campaign.business)
  if (business) {
    business.totalRepaid = business.totalRepaid.plus(event.params.shareAmount)
    business.save()
  }
}

export function handleReturnsWithdrawn(event: ReturnsWithdrawn): void {
  let investor = Investor.load(event.params.contributor.toHexString())
  if (!investor) {
    return
  }
  
  investor.totalReturns = investor.totalReturns.plus(event.params.amount)
  investor.save()
}

export function handleRepaymentCompleted(event: RepaymentCompleted): void {
  let campaign = Campaign.load(event.address.toHexString())
  if (!campaign) {
    return
  }
  
  campaign.repaymentActive = false
  campaign.save()
  
  // Update investor active investments
  let investors = campaign.investors.load()
  for (let i = 0; i < investors.length; i++) {
    let investor = Investor.load(investors[i].id)
    if (investor && investor.activeInvestments > 0) {
      investor.activeInvestments = investor.activeInvestments - 1
      investor.save()
    }
  }
}