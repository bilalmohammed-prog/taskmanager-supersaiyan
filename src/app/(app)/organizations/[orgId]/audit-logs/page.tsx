"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/providers/toast";
import { listAuditLogs } from "@/actions/audit/list";
import { AuditLog } from "@/lib/types/audit-log";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useParams } from "next/navigation";

export default function AuditLogsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const { addToast } = useToast();

  const loadLogs = useCallback(async (isNewSearch = false) => {
    try {
      const data = await listAuditLogs({
            organizationId: orgId,

            search,

            cursor: isNewSearch
                ? null
                : cursor,

            limit: 25,
        });
      
      setLogs(prev => isNewSearch ? data : [...prev, ...data]);
      setCursor(data.length > 0 ? data[data.length - 1].created_at : undefined);
    } catch {
      addToast("Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  }, [orgId, search, cursor, addToast]);

  useEffect(() => { loadLogs(true); }, [search]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="sticky top-0 z-10 bg-white pb-4 border-b">
        <h1 className="text-2xl font-semibold mb-4">Audit Logs</h1>
        <Input 
          placeholder="Search logs..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="p-4 text-left">Actor</th>
              <th className="p-4 text-left">Action</th>
              <th className="p-4 text-left">Changes</th>
              <th className="p-4 text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <AuditLogRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditLogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
    
  return (
    <tr className="border-b hover:bg-zinc-50/50 transition-colors">
      <td className="p-4 font-medium">{log.actor_name}</td>
      <td className="p-4 capitalize">{log.action} {log.entity_type}</td>
      <td className="p-4">
        {log.action === 'UPDATE' ? (
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-indigo-600">
            {expanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            View Changes
          </button>
        ) : (
          <span className="text-zinc-500 italic">No detailed changes</span>
        )}
        {expanded && (
    <div className="...">
        {log.changes.map((change) => (
            <div key={change.field}>
                <strong>{change.field}</strong>

                {" : "}

                {String(change.before)}

                {" → "}

                {String(change.after)}
            </div>
        ))}
    </div>
)}
      </td>
      <td className="p-4 text-zinc-500">{format(new Date(log.created_at), "PPp")}</td>
    </tr>
  );
}