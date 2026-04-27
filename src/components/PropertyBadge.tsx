const ONE_DAY_MS = 86_400_000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

export type BadgeType = "New" | "Hot" | "Limited" | "Sold Out" | "Verified";

interface BadgeProps {
  type: BadgeType;
}

const BADGE_STYLES: Record<BadgeType, string> = {
  New: "bg-blue-100 text-blue-700",
  Hot: "bg-red-100 text-red-700",
  Limited: "bg-orange-100 text-orange-700",
  "Sold Out": "bg-gray-200 text-gray-600",
  Verified: "bg-green-100 text-green-700",
};

export function PropertyBadge({ type }: BadgeProps) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_STYLES[type]}`}>
      {type}
    </span>
  );
}

interface PropertyBadgesProps {
  listedAt: Date;
  purchaseVolume24h: number;
  tokensRemaining: number;
  totalTokens: number;
  isVerified: boolean;
}

export function resolvePropertyBadges({
  listedAt,
  purchaseVolume24h,
  tokensRemaining,
  totalTokens,
  isVerified,
}: PropertyBadgesProps): BadgeType[] {
  const badges: BadgeType[] = [];
  const age = Date.now() - listedAt.getTime();

  if (tokensRemaining === 0) {
    badges.push("Sold Out");
  } else {
    if (age <= SEVEN_DAYS_MS) badges.push("New");
    if (purchaseVolume24h > 50) badges.push("Hot");
    if (tokensRemaining / totalTokens < 0.1) badges.push("Limited");
  }

  if (isVerified) badges.push("Verified");
  return badges;
}

export function PropertyBadgeList(props: PropertyBadgesProps) {
  const badges = resolvePropertyBadges(props);
  if (!badges.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => <PropertyBadge key={b} type={b} />)}
    </div>
  );
}
