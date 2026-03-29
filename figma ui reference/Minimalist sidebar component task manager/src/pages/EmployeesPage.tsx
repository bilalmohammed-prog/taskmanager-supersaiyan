import { MoreVertical, Search, Plus, Filter, Download } from "lucide-react";
import { Button } from "../components/ui/Button";

// Mock Data
const EMPLOYEES = [
  { id: 1, name: "Bilal Mohammed", role: "Product Manager", email: "bilal.m@company.co", department: "Product", status: "Active" },
  { id: 2, name: "Sarah Jenkins", role: "Senior Developer", email: "sarah.j@company.co", department: "Engineering", status: "Active" },
  { id: 3, name: "David Chen", role: "UX Designer", email: "david.c@company.co", department: "Design", status: "On Leave" },
  { id: 4, name: "Elena Rostova", role: "Marketing Lead", email: "elena.r@company.co", department: "Marketing", status: "Active" },
];

export function EmployeesPage() {
  return (
    <div className="w-full flex flex-col space-y-8 max-w-5xl pb-16">
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-[2rem] font-medium tracking-tight text-zinc-900 leading-none">Employees</h1>
          <p className="text-[15px] text-zinc-500 max-w-lg">
            Manage your team members, roles, and account permissions.
          </p>
        </div>
        
        {/* Actions Toolbar */}
        <div className="flex w-full md:w-auto gap-3 shrink-0 items-center">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-zinc-200 bg-white text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent placeholder:text-zinc-400"
            />
          </div>
          <Button variant="outline" size="icon" className="hidden sm:flex shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="hidden sm:flex shrink-0">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Employee Cards List */}
      <div className="flex flex-col gap-3">
        {EMPLOYEES.map((employee) => (
          <div
            key={employee.id}
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 sm:py-5 bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-all hover:shadow-md hover:border-zinc-300 relative"
          >
            {/* Left: User Info */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar Initial */}
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200/80 shadow-inner">
                <span className="text-[15px] font-semibold text-zinc-700">
                  {employee.name.charAt(0)}
                </span>
                {/* Status Indicator */}
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                    employee.status === "Active" ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                />
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-medium text-zinc-900 truncate">
                  {employee.name}
                </span>
                <span className="text-sm text-zinc-500 truncate mt-0.5 flex items-center gap-2">
                  {employee.email}
                  <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-zinc-300"></span>
                  <span className="hidden sm:inline-block">{employee.department}</span>
                </span>
              </div>
            </div>

            {/* Right: Meta & Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 border-zinc-100 pt-3 sm:pt-0 mt-2 sm:mt-0">
              <div className="flex items-center gap-4">
                {/* Role Badge */}
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-50 text-xs font-medium text-zinc-600 border border-zinc-200/60">
                  {employee.role}
                </span>
              </div>

              {/* Actions Dropdown Trigger */}
              <button
                type="button"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
