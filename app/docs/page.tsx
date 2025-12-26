"use client";

import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function DocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const response = await fetch("/api/docs");
        const apiSpec = await response.json();
        setSpec(apiSpec);
      } catch (error) {
        console.error("Failed to fetch API spec:", error);
      }
    };

    fetchSpec();
  }, []);

  if (!spec) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-lg">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto bg-gray-50">
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">eService API Documentation</h1>
          <p className="mt-2 text-blue-100">
            Comprehensive API documentation for the eService platform
          </p>
          <div className="mt-4 text-sm">
            <p>
              <strong>Base URL:</strong>{" "}
              {process.env.NODE_ENV === "production"
                ? "https://your-domain.com"
                : "http://localhost:3000"}
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <SwaggerUI spec={spec} />
        </div>
      </div>
    </div>
  );
}
