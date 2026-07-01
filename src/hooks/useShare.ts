export interface ShareData {
  title: string;
  text: string;
  url: string;
}

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