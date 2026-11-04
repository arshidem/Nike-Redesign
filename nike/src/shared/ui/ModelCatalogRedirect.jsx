import React from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";

// Keep existing model links/bookmarks usable without a separate product listing.
export default function ModelCatalogRedirect() {
  const { modelName } = useParams();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set("model", modelName);
  params.delete("page");
  return (
    <Navigate
      to={{ pathname: "/products", search: params.toString() }}
      replace
    />
  );
}
