export interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Shares content through the Web Share API, falling back to the clipboard where
 * the API is unavailable.
 */
export function useShare() {
  const share = async ({ title, text, url }: ShareData) => {
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      });
      return;
    }

    await navigator.clipboard.writeText(url);
  };

  return { share };
}