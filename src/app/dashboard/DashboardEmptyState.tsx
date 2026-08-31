import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white p-12 text-center">
      <h2 className="text-2xl font-bold">
        Welcome to your dashboard
      </h2>

      <p className="mt-3 max-w-md text-muted-foreground">
        You don't have any portfolio activity yet.
        Connect your wallet, browse properties,
        or take a quick tour to get started.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/wallet">
            Connect Wallet
          </Link>
        </Button>

        <Button variant="outline" asChild>
          <Link href="/properties">
            Browse Properties
          </Link>
        </Button>

        <Button variant="secondary">
          Take a Tour
        </Button>
      </div>
    </div>
  );
}