import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { EmployeesPage } from "./pages/EmployeesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: EmployeesPage },
      // Placeholders for other routes
      { path: "projects", Component: () => <div className="p-8">Projects Content</div> },
      { path: "analytics", Component: () => <div className="p-8">Analytics Content</div> },
      { path: "inbox", Component: () => <div className="p-8">Inbox Content</div> },
    ],
  },
]);
