export interface CampaignShareData {
  id: string;
  title: string;
  businessName: string;
  description?: string;
  image?: string;
  goal: number;
  raised: number;
  progressPercentage: number;
  daysLeft: number;
}

export interface ShareUrlConfig {
  title: string;
  text: string;
  url: string;
  hashtags?: string;
  image?: string;
}

export const generateShareUrls = (campaign: CampaignShareData, customMessage?: string): Record<string, string> => {
  const campaignUrl = `${window.location.origin}/campaign/${campaign.id}`;
  const defaultText = `Support ${campaign.businessName} on Jama - help them reach their $${campaign.goal.toLocaleString()} goal! ${Math.round(campaign.progressPercentage)}% funded so far.`;
  const shareText = customMessage || defaultText;
  const hashtags = 'fundraising,revenue-based-financing,jama,web3';
  
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`,
    
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${hashtags.split(',').map(h => `#${h}`).join(' ')}\n\n${campaignUrl}`)}`,
    
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(campaignUrl)}&title=${encodeURIComponent(`Support ${campaign.businessName}`)}&summary=${encodeURIComponent(shareText)}`,
    
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${campaignUrl}`)}`,
    
    telegram: `https://t.me/share/url?url=${encodeURIComponent(campaignUrl)}&text=${encodeURIComponent(shareText)}`,
    
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(campaignUrl)}&title=${encodeURIComponent(`Support ${campaign.businessName} - ${campaign.title}`)}`,
    
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(campaignUrl)}&description=${encodeURIComponent(shareText)}&media=${encodeURIComponent(campaign.image || '')}`,
    
    email: `mailto:?subject=${encodeURIComponent(`Support ${campaign.businessName}`)}&body=${encodeURIComponent(`Hi,\n\nI wanted to share this fundraising campaign with you:\n\n${campaign.businessName} - ${campaign.title}\n\n${shareText}\n\n${campaignUrl}\n\nEvery contribution makes a difference!\n\nBest regards`)}`,
    
    messenger: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(campaignUrl)}&app_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''}`,
    
    discord: campaignUrl, // Discord doesn't have direct share link, will copy to clipboard
    
    bluesky: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${shareText}\n\n${campaignUrl}`)}`,
    
    farcaster: `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(campaignUrl)}`,
    
    tiktok: `https://www.tiktok.com/share?url=${encodeURIComponent(campaignUrl)}`,
    
    snapchat: `https://www.snapchat.com/share?url=${encodeURIComponent(campaignUrl)}`
  };
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const formatShareMessage = (template: 'personal' | 'milestone' | 'urgent' | 'grateful', campaign: CampaignShareData, contributionAmount?: number): string => {
  const templates = {
    personal: contributionAmount 
      ? `I just contributed $${contributionAmount} to "${campaign.title}" and you can help too! Every contribution brings us closer to the $${campaign.goal.toLocaleString()} goal. 💚`
      : `Check out this amazing fundraising campaign for "${campaign.title}"! Help ${campaign.businessName} reach their goal. 💚`,
    
    milestone: `Amazing! "${campaign.title}" just reached ${Math.round(campaign.progressPercentage)}% of its goal! ${contributionAmount ? `I contributed $${contributionAmount} - ` : ''}Who's next? 🎯`,
    
    urgent: `Only $${(campaign.goal - campaign.raised).toLocaleString()} left to go for "${campaign.title}"! ${contributionAmount ? `I just contributed $${contributionAmount}. ` : ''}Can you help us cross the finish line? 🏃‍♂️`,
    
    grateful: `Feeling grateful to support "${campaign.title}"${contributionAmount ? ` with a $${contributionAmount} contribution` : ''}. This cause means a lot and I hope you'll consider helping too! 🙏`
  };
  
  return templates[template];
};

export const trackShareEvent = async (campaignId: string, platform: string, eventType: 'share' | 'click' | 'convert') => {
  try {
    await fetch('/api/analytics/share-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId,
        platform,
        eventType,
        timestamp: Date.now()
      }),
    });
  } catch (error) {
    console.error('Failed to track share event:', error);
  }
};