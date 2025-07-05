import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

const ErrorMessage = ({ 
  message, 
  className = "",
  onRetry,
  retryText = "Try Again"
}) => {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-2 p-2 text-red-600 ${className}`}>
      <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 text-sm font-medium text-red-700 hover:text-red-800"
        >
          {retryText}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;