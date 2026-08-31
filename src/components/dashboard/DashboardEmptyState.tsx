interface DashboardEmptyStateProps {
  onConnectWallet?: () => void;
  onBrowseProperties?: () => void;
  onTakeTour?: () => void;
}

export default function DashboardEmptyState({
  onConnectWallet,
  onBrowseProperties,
  onTakeTour,
}: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed p-10 text-center">
      <h2 className="text-2xl font-semibold">
        Welcome to your dashboard
      </h2>

      <p className="mt-3 max-w-md text-gray-500">
        You haven't made any purchases or activity yet.
        Get started by connecting your wallet,
        browsing available properties,
        or taking a quick tour.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={onConnectWallet}
          className="rounded-md bg-black px-5 py-2 text-white"
        >
          Connect Wallet
        </button>

        <button
          onClick={onBrowseProperties}
          className="rounded-md border px-5 py-2"
        >
          Browse Properties
        </button>

        <button
          onClick={onTakeTour}
          className="rounded-md border px-5 py-2"
        >
          Take a Tour
        </button>
      </div>
    </div>
  );
}