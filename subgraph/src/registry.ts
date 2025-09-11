import { BigInt } from "@graphprotocol/graph-ts"
import {
  BusinessRegistered,
  BusinessVerified
} from "../generated/BusinessRegistry/BusinessRegistry"
import { Business } from "../generated/schema"

export function handleBusinessRegistered(event: BusinessRegistered): void {
  let business = Business.load(event.params.business.toHexString())
  
  if (!business) {
    business = new Business(event.params.business.toHexString())
    business.totalRaised = BigInt.fromI32(0)
    business.totalRepaid = BigInt.fromI32(0)
    business.campaignCount = 0
    business.isVerified = false
  }
  
  business.name = event.params.name
  business.metadataURI = event.params.metadataURI
  business.isRegistered = true
  business.registeredAt = event.params.timestamp
  
  business.save()
}

export function handleBusinessVerified(event: BusinessVerified): void {
  let business = Business.load(event.params.business.toHexString())
  
  if (!business) {
    // This shouldn't happen if business is registered first
    business = new Business(event.params.business.toHexString())
    business.name = ""
    business.metadataURI = ""
    business.isRegistered = false
    business.registeredAt = BigInt.fromI32(0)
    business.totalRaised = BigInt.fromI32(0)
    business.totalRepaid = BigInt.fromI32(0)
    business.campaignCount = 0
  }
  
  business.isVerified = true
  business.verifiedBy = event.params.verifier.toHexString()
  business.verifiedAt = event.params.timestamp
  
  business.save()
}