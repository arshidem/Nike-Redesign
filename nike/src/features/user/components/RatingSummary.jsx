import React from "react";
import { StarIcon } from "../../../shared/ui/Icons"; // Or just use ★ directly

const RatingSummary = ({ reviews }) => {
  if (!reviews || reviews.length === 0) return null;

  // Count how many reviews for each rating
  const ratingCounts = [0, 0, 0, 0, 0, 0]; // index 0 unused
  let total = 0;
  let sum = 0;

  reviews.forEach((r) => {
    const rate = r.rating;
    ratingCounts[rate]++;
    sum += rate;
    total++;
  });

  const average = (sum / total).toFixed(1);
  const maxCount = Math.max(...ratingCounts);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Rating & Reviews</h3>
      <div className="flex items-center space-x-4 mb-2">
        <div className="text-4xl font-bold">{average}</div>
        <div className="flex flex-col">
          <div className="text-yellow-400 text-lg">
            {"★".repeat(Math.round(average))}
            {"☆".repeat(5 - Math.round(average))}
          </div>
          <div className="text-sm text-gray-500">{total} ratings</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="space-y-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingCounts[star];
          const percentage = maxCount ? (count / maxCount) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-6 text-yellow-400">{star}★</span>
              <div className="flex-1 bg-gray-200 h-2 rounded relative">
                <div
                  className="absolute h-2 bg-orange-500 rounded"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="w-6 text-right text-gray-600">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingSummary;
