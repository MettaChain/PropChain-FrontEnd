"use client";

export type ProposalStatus = "active" | "passed" | "failed";

export interface GovernanceProposalCardProps {
  title: string;
  description: string;
  proposalId: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes?: number;
  status: ProposalStatus;
  quorum?: number;
  endsAt?: string;
  dark?: boolean;
}

const numberFormat = new Intl.NumberFormat("en-US", { notation: "compact" });

export function GovernanceProposalCard({
  title,
  description,
  proposalId,
  yesVotes,
  noVotes,
  abstainVotes = 0,
  status,
  quorum = 0,
  endsAt,
  dark = false,
}: GovernanceProposalCardProps) {
  const total = Math.max(0, yesVotes) + Math.max(0, noVotes) + Math.max(0, abstainVotes);
  const yesPercent = total > 0 ? (Math.max(0, yesVotes) / total) * 100 : 0;
  const noPercent = total > 0 ? (Math.max(0, noVotes) / total) * 100 : 0;
  const statusStyles: Record<ProposalStatus, string> = {
    active: "bg-blue-100 text-blue-800",
    passed: "bg-emerald-100 text-emerald-800",
    failed: "bg-rose-100 text-rose-800",
  };
  const surface = dark ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900";

  return (
    <article aria-label={`Proposal ${proposalId}: ${title}`} className={`w-full rounded-xl border p-5 shadow-sm ${surface}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{proposalId}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}>{status}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <div className="mt-5 flex justify-between text-sm">
        <span>Vote distribution</span>
        <span className="font-medium tabular-nums">{numberFormat.format(total)} votes</span>
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-200" aria-label={`Yes ${yesPercent.toFixed(1)}%, no ${noPercent.toFixed(1)}%`}>
        <div className="bg-emerald-500" style={{ width: `${yesPercent}%` }} />
        <div className="bg-rose-500" style={{ width: `${noPercent}%` }} />
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div><dt className="text-slate-500">For</dt><dd className="font-semibold">{numberFormat.format(yesVotes)}</dd></div>
        <div><dt className="text-slate-500">Against</dt><dd className="font-semibold">{numberFormat.format(noVotes)}</dd></div>
        <div><dt className="text-slate-500">Abstain</dt><dd className="font-semibold">{numberFormat.format(abstainVotes)}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500">
        <span>Quorum: {numberFormat.format(quorum)} votes</span>
        {endsAt && <span>Ends: {endsAt}</span>}
      </div>
    </article>
  );
}

export default GovernanceProposalCard;
