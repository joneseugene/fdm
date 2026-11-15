import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/features/content/icons";

export function SocialIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  const { Icon } = SOCIAL_PLATFORMS[platform] ?? SOCIAL_PLATFORMS.website;
  return <Icon className={className} />;
}
