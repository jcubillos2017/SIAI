import { RouterProvider, createBrowserRouter } from "react-router-dom";
import LoginPage from "@/features/auth/LoginPage";
import DashboardLayout from "@/features/admin/DashboardLayout";
import DashboardHome from "@/features/admin/DashboardHome";
import ImportsPage from "@/features/imports/ImportsPage";
import { RequireAuth, RequireAdmin } from "@/features/auth/guards";
import UserPage from "@/features/users/UsersPage";
import InventoryHub from "@/features/inventory/InventoryHub";
import InventoryPage from "@/features/inventory/InventoryPage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },

  {
    path: "/admin",
    element: (
      <RequireAuth>
        <RequireAdmin>
          <DashboardLayout />
        </RequireAdmin>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "imports", element: <ImportsPage /> },
      { path: "users", element: <UserPage /> },
      { path: "inventory", element: <InventoryHub /> },
      { path: "inventory/computers", element: <InventoryPage /> },

    ],
  },

  { path: "*", element: <LoginPage /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}