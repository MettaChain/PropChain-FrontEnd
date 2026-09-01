import { use } from 'react';
import Link from 'next/link';
import { CopyProfileLinkButton } from '@/components/profile/CopyProfileLinkButton';
import { User } from 'lucide-react';

export default function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);

  // TODO: Fetch creator profile data based on username
  // This would typically come from an API or database query

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to home
        </Link>

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {username}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Creator Profile
                </p>
              </div>
            </div>
          </div>

          {/* Copy Link Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <CopyProfileLinkButton
              username={username}
              variant="default"
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {/* Profile Content Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile Details
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Creator profile content will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
}
