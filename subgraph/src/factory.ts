import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  CampaignCreated,
  ParametersUpdated
} from "../generated/RBFCampaignFactory/RBFCampaignFactory"
import { RBFCampaign } from "../generated/templates"
import { Campaign, Factory, Business } from "../generated/schema"

export function handleCampaignCreated(event: CampaignCreated): void {
  // Get or create factory
  let factory = Factory.load("1")
  if (!factory) {
    factory = new Factory("1")
    factory.campaignCount = BigInt.fromI32(0)
    factory.totalRaised = BigInt.fromI32(0)
  }
  factory.campaignCount = factory.campaignCount.plus(BigInt.fromI32(1))
  factory.save()

  // Get or create business
  let business = Business.load(event.params.business.toHexString())
  if (!business) {
    business = new Business(event.params.business.toHexString())
    business.name = ""
    business.metadataURI = ""
    business.isRegistered = false
    business.isVerified = false
    business.registeredAt = BigInt.fromI32(0)
    business.totalRaised = BigInt.fromI32(0)
    business.totalRepaid = BigInt.fromI32(0)
    business.campaignCount = 0
  }
  business.campaignCount = business.campaignCount + 1
  business.save()

  // Create campaign
  let campaign = new Campaign(event.params.campaign.toHexString())
  campaign.factory = factory.id
  campaign.business = business.id
  campaign.campaignId = event.params.campaignId
  campaign.owner = event.params.business.toHexString()
  campaign.metadataURI = event.params.metadataURI
  campaign.fundingGoal = event.params.fundingGoal
  campaign.totalFunded = BigInt.fromI32(0)
  campaign.deadline = event.params.deadline
  campaign.revenueSharePercent = event.params.revenueSharePercent
  campaign.repaymentCap = event.params.repaymentCap
  campaign.fundingActive = true
  campaign.repaymentActive = false
  campaign.totalRepaid = BigInt.fromI32(0)
  campaign.totalRevenueShared = BigInt.fromI32(0)
  campaign.createdAt = event.block.timestamp
  campaign.contributionCount = 0
  campaign.investorCount = 0
  campaign.save()

  // Create campaign template instance to track its events
  RBFCampaign.create(event.params.campaign)
}

export function handleParametersUpdated(event: ParametersUpdated): void {
  // This event doesn't affect our entities directly
  // Could be used for tracking parameter history if needed
}