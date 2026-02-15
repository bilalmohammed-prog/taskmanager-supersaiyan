import { listResources } from "@/actions/resource/list";

export default async function ResourcesPage() {
  const resources = await listResources();

  return (
    <div>
      <h1>Resources</h1>

      {resources.length === 0 && <p>No resources yet</p>}

      <ul>
        {resources.map((r) => (
          <li key={r.id}>
            {r.name} — {r.type} — Capacity: {r.capacity ?? "N/A"}
          </li>
        ))}
      </ul>
    </div>
  );
}
