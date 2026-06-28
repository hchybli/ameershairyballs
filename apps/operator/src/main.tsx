import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  AuthProvider,
  LoginPage,
  OPERATOR_APP_ROLES,
  RequireRole,
  UnauthorizedPage,
} from "@backstop/auth";
import { ClaimDetailPage } from "./pages/claim-detail";
import { UploadPage } from "./pages/upload";
import { WorkQueuePage } from "./pages/work-queue";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage title="Operator sign in" />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/"
            element={
              <RequireRole allowed={OPERATOR_APP_ROLES}>
                <WorkQueuePage />
              </RequireRole>
            }
          />
          <Route
            path="/claims/:id"
            element={
              <RequireRole allowed={OPERATOR_APP_ROLES}>
                <ClaimDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/upload"
            element={
              <RequireRole allowed={OPERATOR_APP_ROLES}>
                <UploadPage />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
