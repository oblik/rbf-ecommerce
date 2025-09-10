import { 
  BusinessRegistered,
  BusinessVerified
} from '../../generated/BusinessRegistry/BusinessRegistry'
import { Business } from '../../generated/schema'

export function handleBusinessRegistered(event: BusinessRegistered): void {
  let business = new Business(event.params.business.toHex())
  business.name = event.params.name
  business.metadataURI = event.params.metadataURI
  business.isVerified = false
  business.isSuspended = false
  business.registeredAt = event.params.timestamp
  business.save()
}

export function handleBusinessVerified(event: BusinessVerified): void {
  let business = Business.load(event.params.business.toHex())
  if (business) {
    business.isVerified = true
    business.save()
  }
}