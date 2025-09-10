import {
  Contributed,
  FundingGoalReached,
  RevenueShared,
  ReturnsWithdrawn,
  RepaymentCompleted
} from '../../generated/templates/RBFCampaign/RBFCampaign'
import { Campaign, Contribution, Investor, Factory } from '../../generated/schema'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleContributed(event: Contributed): void {
  // Load campaign
  let campaign = Campaign.load(event.address.toHex())
  if (!campaign) return
  
  // Update campaign total
  campaign.totalFunded = campaign.totalFunded.plus(event.params.amount)
  campaign.save()
  
  // Update factory total
  let factory = Factory.load('1')
  if (factory) {
    factory.totalFunded = factory.totalFunded.plus(event.params.amount)
    factory.save()
  }
  
  // Create or update investor
  let investor = Investor.load(event.params.contributor.toHex())
  if (!investor) {
    investor = new Investor(event.params.contributor.toHex())
    investor.totalContributed = BigInt.fromI32(0)
    investor.totalReturns = BigInt.fromI32(0)
    investor.campaigns = []
  }
  
  investor.totalContributed = investor.totalContributed.plus(event.params.amount)
  
  // Add campaign to investor if not already there
  let campaigns = investor.campaigns
  if (campaigns.indexOf(campaign.id) == -1) {
    campaigns.push(campaign.id)
    investor.campaigns = campaigns
  }
  investor.save()
  
  // Create contribution
  let contributionId = campaign.id + '-' + investor.id
  let contribution = Contribution.load(contributionId)
  if (!contribution) {
    contribution = new Contribution(contributionId)
    contribution.campaign = campaign.id
    contribution.investor = investor.id
    contribution.amount = BigInt.fromI32(0)
  }
  contribution.amount = contribution.amount.plus(event.params.amount)
  contribution.timestamp = event.block.timestamp
  contribution.save()
}

export function handleFundingGoalReached(event: FundingGoalReached): void {
  let campaign = Campaign.load(event.address.toHex())
  if (campaign) {
    campaign.fundingActive = false
    campaign.repaymentActive = true
    campaign.save()
  }
}

export function handleRevenueShared(event: RevenueShared): void {
  let campaign = Campaign.load(event.address.toHex())
  if (campaign) {
    campaign.totalRepaid = campaign.totalRepaid.plus(event.params.shareAmount)
    campaign.lastRevenueReport = event.block.timestamp
    campaign.save()
  }
}

export function handleReturnsWithdrawn(event: ReturnsWithdrawn): void {
  let investor = Investor.load(event.params.contributor.toHex())
  if (investor) {
    investor.totalReturns = investor.totalReturns.plus(event.params.amount)
    investor.save()
  }
}

export function handleRepaymentCompleted(event: RepaymentCompleted): void {
  let campaign = Campaign.load(event.address.toHex())
  if (campaign) {
    campaign.repaymentComplete = true
    campaign.repaymentActive = false
    campaign.save()
  }
}