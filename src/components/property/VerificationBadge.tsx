
type VerificationBadgeProps = {
    verified: boolean;
    verifiedAt?: string;
  };
  
  export default function VerificationBadge({
    verified,
    verifiedAt,
  }: VerificationBadgeProps) {
    if (verified) {
      return (
        <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
  
          <span>
            Verified
            {verifiedAt ? ` • ${new Date(verifiedAt).toLocaleDateString()}` : ""}
          </span>
        </div>
      );
    }
  
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10A8 8 0 112 10a8 8 0 0116 0zM9 6a1 1 0 012 0v4a1 1 0 11-2 0V6zm1 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z"
            clipRule="evenodd"
          />
        </svg>
  
        <span>Pending Verification</span>
      </div>
    );
  }