import { CampaignCreated, ParametersUpdated } from '../../generated/RBFCampaignFactory/RBFCampaignFactory'
import { RBFCampaign } from '../../generated/templates'
import { Campaign, Factory } from '../../generated/schema'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleCampaignCreated(event: CampaignCreated): void {
  // Create or load factory
  let factory = Factory.load('1')
  if (!factory) {
    factory = new Factory('1')
    factory.campaignCount = 0
    factory.totalFunded = BigInt.fromI32(0)
  }
  
  factory.campaignCount = factory.campaignCount + 1
  factory.save()
  
  // Create campaign entity
  let campaign = new Campaign(event.params.campaign.toHex())
  campaign.factory = factory.id
  campaign.business = event.params.business.toHex()
  campaign.metadataURI = event.params.metadataURI
  campaign.fundingGoal = event.params.fundingGoal
  campaign.fundingDeadline = event.params.deadline
  campaign.totalFunded = BigInt.fromI32(0)
  campaign.fundingActive = true
  campaign.revenueSharePercent = event.params.revenueSharePercent
  campaign.repaymentCap = event.params.repaymentCap
  campaign.totalRepaid = BigInt.fromI32(0)
  campaign.repaymentActive = false
  campaign.repaymentComplete = false
  campaign.lastRevenueReport = BigInt.fromI32(0)
  campaign.createdAt = event.block.timestamp
  campaign.save()
  
  // Create template instance to track campaign events
  RBFCampaign.create(event.params.campaign)
}

export function handleParametersUpdated(event: ParametersUpdated): void {
  // You can track parameter changes here if needed
}