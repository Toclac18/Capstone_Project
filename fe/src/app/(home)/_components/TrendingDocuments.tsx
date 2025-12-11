"use client";

import { TrendingDocument } from "@/services/homepage.service";
import { Eye, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { sanitizeImageUrl } from "@/utils/imageUrl";

const THUMBNAIL_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/document-thumbnails/";

interface TrendingDocumentsProps {
  documents: TrendingDocument[];
}

export function TrendingDocuments({ documents }: TrendingDocumentsProps) {
  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="mb-8 text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
          Trending Documents
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Most popular documents in the last 7 days
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {documents.map((doc) => {
          const thumbnailUrl: string = doc.thumbnailUrl
            ? (sanitizeImageUrl(
                doc.thumbnailUrl,
                THUMBNAIL_BASE_URL,
                "/images/document.jpg"
              ) || "/images/document.jpg")
            : "/images/document.jpg";

          return (
            <Link
              key={doc.id}
              href={`/docs-view/${doc.id}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl dark:bg-gray-800"
            >
              {/* Thumbnail */}
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={thumbnailUrl}
                  alt={doc.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = "/images/document.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Engagement Score Badge */}
                <div className="absolute right-4 top-4 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {doc.engagementScore.toFixed(0)} pts
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {doc.title}
                </h3>
                <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                  {doc.description}
                </p>

                {/* Meta Info */}
                <div className="mb-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {doc.docType && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-700">
                      {doc.docType}
                    </span>
                  )}
                  {doc.specialization && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-700">
                      {doc.specialization}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{doc.viewCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{doc.voteScore}</span>
                    </div>
                  </div>
                </div>

                {/* Uploader */}
                {doc.uploader && (
                  <div className="mt-3 flex items-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <img
                        src={
                          doc.uploader.avatarUrl
                            ? (sanitizeImageUrl(
                                doc.uploader.avatarUrl,
                                "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/avatars/",
                                "/images/user.png"
                              ) || "/images/user.png")
                            : "/images/user.png"
                        }
                        alt={doc.uploader.fullName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/images/user.png";
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {doc.uploader.fullName}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

