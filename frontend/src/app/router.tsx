import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@/features/auth/LoginPage";
import AdminLayout from "@/features/admin/AdminLayout";
import ImportsPage from "@/features/imports/ImportsPage";
import { RequireAuth, RequireAdmin } from "@/features/auth/guards";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },

  {
    path: "/admin",
    element: (
      <RequireAuth>
        <RequireAdmin>
          <AdminLayout />
        </RequireAdmin>
      </RequireAuth>
    ),
    children: [
      { path: "imports", element: <ImportsPage /> },
      // luego: { path: "users", element: <UsersPage /> }
    ],
  },

  { path: "*", element: <LoginPage /> },
]);