import { useShare } from "@/hooks/useShare";
import {
  SHARE_TEXT,
  SHARE_TITLE,
} from "@/lib/share";

interface Props {
  referralLink: string;
}

export default function ShareButtons({
  referralLink,
}: Props) {
  const { share } = useShare();

  return (
    <button
      onClick={() =>
        share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: referralLink,
        })
      }
    >
      Share
    </button>
  );
}