"use client";

import { useState, useEffect } from "react";
import { SystemDescription } from "./_components/SystemDescription";
import { FeaturedCarousel } from "./_components/FeaturedCarousel";
import { TrendingReviewers } from "./_components/TrendingReviewers";
import {
  fetchTrendingDocuments,
  fetchTrendingReviewers,
  type TrendingDocument,
  type TrendingReviewer,
} from "@/services/homepage.service";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

const Home = () => {
  const { showToast } = useToast();
  const router = useRouter();
  const [trendingDocuments, setTrendingDocuments] = useState<TrendingDocument[]>([]);
  const [trendingReviewers, setTrendingReviewers] = useState<TrendingReviewer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Force refresh on mount to get latest data
        const [documents, reviewers] = await Promise.all([
          fetchTrendingDocuments(),
          fetchTrendingReviewers(true), // Force refresh to bypass cache
        ]);
        setTrendingDocuments(documents);
        setTrendingReviewers(reviewers);
      } catch (error: any) {
        console.error("Failed to load homepage data:", error);
        showToast({
          type: "error",
          title: "Load Error",
          message: "Failed to load trending data. Please try again later.",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showToast]);

  const handleDocumentClick = (card: TrendingDocument | any) => {
    if (card && card.id) {
      router.push(`/docs-view/${card.id}`);
    }
  };

  return (
    <div className="min-h-screen rounded-2xl bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* System Description */}
        <SystemDescription />

        {/* Loading State */}
        {loading && (
          <div className="mb-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading trending data...</p>
          </div>
        )}

        {/* Trending Documents Carousel */}
        {!loading && trendingDocuments.length > 0 && (
          <div className="mb-12 mt-12">
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                Trending Documents
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Most popular documents in the last 7 days
              </p>
            </div>
            <FeaturedCarousel
              documents={trendingDocuments}
              onCardClick={handleDocumentClick}
            />
          </div>
        )}

        {/* Trending Reviewers */}
        {!loading && <TrendingReviewers reviewers={trendingReviewers} />}

        {/* Additional Info Section */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl transition-all duration-500 hover:shadow-2xl">
          <div className="text-center">
            <h3 className="mb-4 text-2xl font-bold">
              Ready to Start Learning?
            </h3>
            <p className="mb-6 text-lg opacity-90">
              Join thousands of students who are already advancing their careers
              with our courses
            </p>
            <button className="rounded-full bg-white px-8 py-3 font-semibold text-blue-600 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-100 hover:shadow-xl" onClick={() => router.push("/signup")}>
              Get Started Today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
