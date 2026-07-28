import useWalletHydration from "../hooks/useWalletHydration";

type HydrationProviderProps = {
  children: React.ReactNode;
};

const HydrationProvider = ({ children }: HydrationProviderProps) => {
  const isHydrated = useWalletHydration();

  return isHydrated ? <>{children}</> : null;
};

export default HydrationProvider;
