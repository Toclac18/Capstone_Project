"use client";

import { TrendingReviewer } from "@/services/homepage.service";
import { Award, Building2 } from "lucide-react";
import { sanitizeImageUrl } from "@/utils/imageUrl";

const AVATAR_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/avatars/";

interface TrendingReviewersProps {
  reviewers: TrendingReviewer[];
}

export function TrendingReviewers({ reviewers }: TrendingReviewersProps) {
  if (!reviewers || reviewers.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="mb-8 text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
          Top Reviewers
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Most active reviewers in the last 7 days
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {reviewers.map((reviewer) => {
          const avatarUrl: string = reviewer.avatarUrl
            ? sanitizeImageUrl(
                reviewer.avatarUrl,
                AVATAR_BASE_URL,
                "/images/user.png"
              ) || "/images/user.png"
            : "/images/user.png";

          return (
            <div
              key={reviewer.id}
              className="group overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl dark:bg-gray-800"
            >
              {/* Avatar */}
              <div className="mb-4 flex justify-center">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-200 ring-4 ring-primary/20 dark:bg-gray-700">
                    <img
                      src={avatarUrl}
                      alt={reviewer.fullName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/images/user.png";
                      }}
                    />
                  </div>
                  {/* Performance Badge */}
                  <div className="absolute -bottom-2 -right-2 rounded-full bg-primary p-2">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Name */}
              <h3 className="mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white">
                {reviewer.fullName}
              </h3>

              {/* Organization */}
              {reviewer.organizationName && (
                <div className="mb-4 flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Building2 className="h-4 w-4" />
                  <span className="line-clamp-1">{reviewer.organizationName}</span>
                </div>
              )}

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Reviews</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {reviewer.totalReviewsSubmitted}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Approval</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {reviewer.approvalRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-primary/10 p-2">
                  <span className="text-xs text-primary">Score</span>
                  <span className="font-semibold text-primary">
                    {reviewer.performanceScore.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

