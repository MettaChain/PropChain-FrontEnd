import ShareButtons from "./ShareButtons";
import CopyButton from "./CopyButton";

interface Props {
  referralLink: string;
  referralCode: string;
}

export default function ReferralShare({
  referralLink,
}: Props) {
  return (
    <div className="rounded-lg border p-6 space-y-4">
      <h2>Invite Friends</h2>

      <p>
        Share your referral link and earn rewards.
      </p>

      <ShareButtons
        referralLink={referralLink}
      />

      <CopyButton
        text={referralLink}
      />
    </div>
  );
}