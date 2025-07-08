import React, { useEffect, useState } from "react";
import { useReviewServices } from "../services/reviewServices";
import { EditIcon, XIcon } from "../../../shared/ui/Icons";
import { useAppContext } from "../../../context/AppContext";
import toast from "react-hot-toast";
import RatingSummary from "./RatingSummary";
import { ConfirmModal } from "../../../shared/ui/Icons";

const StarRating = ({ value, onChange, editable = false }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => editable && onChange(star)}
          className={`text-xl ${
            star <= value ? "text-yellow-400" : "text-gray-300"
          } ${editable ? "hover:text-yellow-500" : ""}`}
        >
          {star <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
};

const ProductReviewSection = ({ productId }) => {
  const { user, isAuthenticated, backendUrl } = useAppContext();
  const { getReviewsByProduct, addReview, updateReview, deleteReview } =
    useReviewServices();

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatImageUrl = (path) => {
    if (!path || typeof path !== "string") return "/placeholder.jpg";
    const match = path.match(/uploads[\\/][\w\-.]+\.(jpg|jpeg|png|webp|avif)/i);
    const relativePath = match ? match[0].replace(/\\/g, "/") : path;
    return `${backendUrl}/${relativePath}`;
  };

  useEffect(() => {
    if (productId) loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const data = await getReviewsByProduct(productId);
      setReviews(data);
    } catch {
      toast.error("Failed to load reviews");
    }
  };

  const handleSubmit = async () => {
    if (!rating || !comment.trim()) {
      toast.error("Rating and comment are required");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingReviewId) {
        await updateReview(editingReviewId, { rating, comment });
        toast.success("Review updated");
      } else {
        await addReview(productId, { rating, comment }, images);
        toast.success("Review added");
      }

      setComment("");
      setRating(0);
      setImages([]);
      setEditingReviewId(null);
      setShowAddModal(false);
      loadReviews();
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteReview(deleteId);
      toast.success("Review deleted");
      loadReviews();
    } catch {
      toast.error("Failed to delete review");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
      setShowAddModal(false);
    }
  };

  const topReviews = [...reviews]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return (
    <div className="mt-10 border-t pt-6">

      <RatingSummary reviews={reviews} />

      <div className="space-y-4 mt-4">
        {topReviews.map((review) => (
          <div
            key={review._id}
            className="border p-4 rounded bg-gray-50 relative"
          >
            <div className="flex justify-between text-sm font-medium mb-1">
              <span>{review.user?.name || review.name}</span>
              <span className="text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            <StarRating value={review.rating} />
            <p className="mt-2 text-sm">{review.comment}</p>
            {review.images?.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {review.images.map((url, idx) => (
                  <img
                    key={idx}
                    src={formatImageUrl(url)}
                    alt="review"
                    className="w-20 h-20 object-cover rounded"
                  />
                ))}
              </div>
            )}
            {user?._id === review.user?._id && (
              <div className="absolute bottom-2 right-2">
                <button
                  onClick={() => {
                    setEditingReviewId(review._id);
                    setRating(review.rating);
                    setComment(review.comment);
                    setShowAddModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <EditIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-4 items-center">
        <button
          onClick={() => setShowAllModal(true)}
          className="px-4 py-2 border rounded text-sm"
        >
          Reviews ({reviews.length})
        </button>
        {isAuthenticated && (
          <button
            onClick={() => {
              setEditingReviewId(null);
              setRating(0);
              setComment("");
              setImages([]);
              setShowAddModal(true);
            }}
            className="bg-black text-white px-4 py-2 text-sm rounded hover:bg-gray-800"
          >
            Add Review
          </button>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between mb-4">
              <h4 className="text-lg font-semibold">
                {editingReviewId ? "Edit Review" : "Add Review"}
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-sm text-gray-600 hover:text-black"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <StarRating value={rating} onChange={setRating} editable />

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border rounded mb-2 mt-3"
              rows={4}
              placeholder="Write your review..."
            />

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages([...e.target.files])}
              className="mb-2"
            />

            {images.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {Array.from(images).map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`preview-${index}`}
                    className="w-20 h-20 object-cover rounded"
                  />
                ))}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800 mb-2"
            >
              {editingReviewId ? "Update Review" : "Submit Review"}
            </button>

            {editingReviewId && (
              <button
                onClick={() => setDeleteId(editingReviewId)}
                className="w-full px-4 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50"
              >
                Delete Review
              </button>
            )}
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Review"
          description="Are you sure you want to delete this review? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          loading={isDeleting}
          onConfirm={confirmDelete}
          onClose={() => setDeleteId(null)}
        />
      )}
      {showAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header - fixed */}
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h4 className="text-lg font-semibold">All Reviews</h4>
              <button
                onClick={() => setShowAllModal(false)}
                className="text-sm text-gray-600 hover:text-black"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 space-y-4">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="border p-4 rounded bg-gray-50 relative"
                >
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span>{review.user?.name || review.name}</span>
                    <span className="text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <StarRating value={review.rating} />
                  <p className="mt-2 text-sm">{review.comment}</p>
                  {review.images?.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {review.images.map((url, idx) => (
                        <img
                          key={idx}
                          src={formatImageUrl(url)}
                          alt="review"
                          className="w-20 h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                  {user?._id === review.user?._id && (
                    <div className="absolute bottom-2 right-2">
                      <button
                        onClick={() => {
                          setEditingReviewId(review._id);
                          setRating(review.rating);
                          setComment(review.comment);
                          setShowAddModal(true);
                          setShowAllModal(false);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviewSection;
