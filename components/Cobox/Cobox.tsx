"use client";

import "./Cobox.css";
import { useState, useEffect } from "react";
import Image from "next/image";

import { useSession } from "next-auth/react";

type Section = "tasks" | "inbox" | "progress" | "teamTasks";

type Task = {
  empID: string;
  id: string;
  task: string;
  description: string;
  startTime: string;
  endTime: string;
  status: string;
  proof: string;
  durationHours: number;
  submittedAt: Date;
  isEditing?: boolean;
};

type EmployeeProgress = {
  empID: string;
  name: string;
  email: string;
  completed: number;
  total: number;
};

interface IMessage {
  _id: string;
  senderEmail: string;
  receiverEmail: string;
  subject: string;
  body: string;
  type: "message" | "invite";
  status: "pending" | "accepted" | "declined" | "read";
  managerID?: string;
  createdAt: string | Date;
}

function prettyDateTime(dt: string | Date | number) {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return String(dt);

  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

function safeISO(dt: string | Date) {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "";

  const pad = (num: number) => String(num).padStart(2, "0");

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}


function UserTasksView() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const email = session?.user?.email;

  useEffect(() => {
    if (!email) return;

    async function load() {
      try {
        setLoading(true);

        // 1️⃣ Get employee by email
        const empRes = await fetch(`/api/get-emp?email=${email}`);
        const empData = await empRes.json();

        if (!empData?.empID) {
          setTasks([]);
          return;
        }

        // 2️⃣ Fetch tasks for that employee
        const taskRes = await fetch(`/api/displayTasks?empID=${empData.empID}`);
        const taskData = await taskRes.json();

        setTasks(taskData.tasks || []);
      } catch (e) {
        console.error("User task load error", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [email]);

  async function markCompleted(task: Task) {
    const proof = prompt("Enter proof of work");
    if (!proof) return alert("Proof is required");

    const submittedAt = new Date();

    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        proof,
        submittedAt
      })
    });

    setTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? { ...t, status: "completed", proof, submittedAt }
          : t
      )
    );
  }

  function getStatusColor(t: Task) {
    if (t.status !== "completed") return "gray";

    const end = new Date(t.endTime);
    const submitted = new Date(t.submittedAt);

    return submitted <= end ? "limegreen" : "gold";
  }

  return (
  <div className="coboxContainer">
    <div className="cobox">
      {loading && (
  <div className="loading-container">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
)}
      {!loading && tasks.length === 0 && (
        <p className="select-promptTaskLoading" style={{ textAlign: "center", marginTop: "20px" }}>
          You have no tasks.
        </p>
      )}
      {!loading &&
        tasks.map((t) => (
          <div
            key={t.id}
            className={`container3 ${selectedTask?.id === t.id ? "active-card" : ""}`}
            onClick={() => setSelectedTask(t)} // 1. Updates state on click
            style={{ cursor: "pointer" }}
          >
            <div className="taskText">
              {t.task}
              <br />
              {prettyDateTime(t.startTime)} → {prettyDateTime(t.endTime)}
            </div>

            <div className="container2">
              <button
                className="action-btn completed-button"
                onClick={(e) => {
                  e.stopPropagation(); // 2. Prevents selecting the card when clicking button
                  markCompleted(t);
                }}
                disabled={t.status === "completed"}
              >
                <Image src="/svg/completed.svg" alt="" width={32} height={32} />
              </button>
              <button
                className="checkbox"
                disabled
                style={{ background: getStatusColor(t) }}
              />
            </div>
          </div>
        ))}
    </div>

    {/* 3. MOVED OUTSIDE THE LOOP: The actual Detail View */}
    <div className="taskDescription">
      {selectedTask ? (
        <div className="description-content">
          <h2>{selectedTask.task}</h2>
          <hr />
          <p><strong>Status:</strong> {selectedTask.status}</p>
          <p><strong>Start:</strong> {prettyDateTime(selectedTask.startTime)}</p>
          <p><strong>Deadline:</strong> {prettyDateTime(selectedTask.endTime)}</p>
          {selectedTask.proof && (
            <div className="proof-box">
              <strong>Proof:</strong>
              <p>{selectedTask.proof}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="select-promptTaskDesc">Select a task to view details</p>
      )}
    </div>
  </div>
);
}





type Props = {
  section: Section;
  selectedEmp: { empID: string; name: string } | null;

  openAssignModal: boolean;
  setOpenAssignModal: React.Dispatch<React.SetStateAction<boolean>>;
  currentManagerID: string | null;
};


export default function Cobox({ section, selectedEmp, openAssignModal, setOpenAssignModal, currentManagerID }: Props) {
  if (section === "tasks") return <UserTasksView />;

  


  if (section === "progress") return <ProgressView currentManagerID={currentManagerID} />;

  if (section === "inbox") return <InboxView />;

  return null;
}

/* ---------------- TEAM TASKS ---------------- */





/* ---------------- OTHER VIEWS ---------------- */



function InboxView() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const [view, setView] = useState<"menu" | "list">("menu");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [search, setSearch] = useState<string>("");
  const [selectedMsg, setSelectedMsg] = useState<IMessage | null>(null);

  const declineInvite = async (msg: IMessage) => {
  const confirmDecline = confirm("Are you sure you want to decline this invitation?");
  if (!confirmDecline) return;

  try {
    const res = await fetch(`/api/invites/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msg._id }),
    });

    if (res.ok) {
      alert("Invitation declined.");
      
      // 1. Update the list so the state is consistent
      setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, status: "declined" } : m));
      
      // 2. IMPORTANT: Update the currently viewed message so the buttons disappear
      setSelectedMsg({ ...msg, status: "declined" });
    } else {
      const errorData = await res.json();
      alert(`Error: ${errorData.error || "Could not decline"}`);
    }
  } catch (err) {
    console.error("Error declining invite:", err);
  }
};

  useEffect(() => {
    if (userEmail) {
      fetch(`/api/messages?email=${userEmail}`)
        .then((res) => res.json())
        .then((data: IMessage[]) => setMessages(data))
        .catch((err) => console.error("Inbox load error:", err));
    }
  }, [userEmail]);

  // Filtering Logic with type safety
  const filteredMessages = messages.filter((m) => {
    if (!userEmail) return false;
    
    const isSent = m.senderEmail === userEmail;
    const isInvite = m.type === "invite";
    
    if (activeCategory === "inv_sent") return isSent && isInvite;
    if (activeCategory === "inv_rec") return !isSent && isInvite;
    if (activeCategory === "msg_sent") return isSent && !isInvite;
    if (activeCategory === "msg_rec") return !isSent && !isInvite;
    return false;
  }).filter((m) => m.subject.toLowerCase().includes(search.toLowerCase()));

  const acceptInvite = async (msg: IMessage) => {
    if (!msg.managerID) return alert("Invalid Invite: No Manager ID found.");
    
    try {
      const res = await fetch(`/api/invites/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messageId: msg._id, 
          managerID: msg.managerID,
          empEmail: userEmail 
        }),
      });

      if (res.ok) {
        alert("Invitation accepted! You are now linked to your manager.");
        // Update local state to show 'accepted'
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, status: "accepted" } : m));
        setSelectedMsg(prev => prev ? { ...prev, status: "accepted" } : null);
      }
    } catch (err) {
      console.error("Error accepting invite:", err);
    }
  };

  if (view === "menu") {
    return (
      <div className="coboxContainer" style={{ gap: "30px" }}>
        {[
          { id: "inv_sent", label: "Invitations Sent" },
          { id: "inv_rec", label: "Invitations Received" },
          { id: "msg_sent", label: "Messages Sent" },
          { id: "msg_rec", label: "Messages Received" },
        ].map((cat) => (
          <div 
            key={cat.id} 
            className="container3 container3Message" 
            onClick={() => { setActiveCategory(cat.id); setView("list"); }}
            style={{ cursor: "pointer" }}
          >
            <div className="taskText">{cat.label}</div>
            <div className="container2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="coboxContainer">
      <div className="cobox">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', width: '90%' }}>
          <button className="action-btn" onClick={() => { setView("menu"); setSelectedMsg(null); }}>
            ←
          </button>
          <input 
            className="edit-input" 
            placeholder="Search subject..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>

        {filteredMessages.length > 0 ? (
          filteredMessages.map((m) => (
            <div 
              key={m._id} 
              className={`container3 ${selectedMsg?._id === m._id ? "active-card" : ""}`} 
              onClick={() => setSelectedMsg(m)}
              style={{ cursor: "pointer" }}
            >
              <div className="taskText">
                {m.subject} <br />
                <span>{m.senderEmail === userEmail ? `To: ${m.receiverEmail}` : `From: ${m.senderEmail}`}</span>
                <small style={{ display: 'block', fontSize: '11px', opacity: 0.6 }}>
                  {new Date(m.createdAt).toLocaleString()}
                </small>
              </div>
            </div>
          ))
        ) : (
          <p className="select-prompt" style={{ textAlign: 'center', marginTop: '20px' }}>No messages found.</p>
        )}
      </div>



<div className="taskDescription">
  {selectedMsg ? (
    <div className="description-content">
      <h2 style={{ color: 'white' }}>{selectedMsg.subject}</h2>
      <hr style={{ opacity: 0.2, margin: '15px 0' }} />
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
        <strong>From:</strong> {selectedMsg.senderEmail}
      </p>
      <p style={{ whiteSpace: 'pre-wrap', marginTop: '20px', lineHeight: '1.6', color: 'white' }}>
        {selectedMsg.body}
      </p>
      
      {/* Updated Buttons Block */}
      {selectedMsg.type === "invite" && 
       selectedMsg.receiverEmail === userEmail && 
       selectedMsg.status === "pending" && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '30px', width: '100%' }}>
          <button 
            className="assignBtn" 
            style={{ flex: 1, margin: 0 }} 
            onClick={() => acceptInvite(selectedMsg)}
          >
            Accept
          </button>
          
          <button 
            className="assignBtn" 
            style={{ flex: 1, margin: 0, background: 'rgb(239, 68, 68)' }} 
            onClick={() => declineInvite(selectedMsg)}
          >
            Decline
          </button>
        </div>
      )}

      {/* Dynamic Status Messages */}


{/* Dynamic Status Messages */}
{selectedMsg.status === "accepted" && (
  <div style={{ marginTop: '20px', padding: '10px', borderRadius: '8px', background: 'rgba(77, 255, 154, 0.1)' }}>
    <p style={{ color: '#4dff9a', fontWeight: 'bold', margin: 0 }}>✓ Invitation Accepted</p>
  </div>
)}

{selectedMsg.status === "declined" && (
  <div style={{ marginTop: '20px', padding: '10px', borderRadius: '8px', background: 'rgba(255, 77, 77, 0.1)' }}>
    <p style={{ color: '#ff4d4d', fontWeight: 'bold', margin: 0 }}>✕ Invitation Declined</p>
  </div>
)}
    </div>
  ) : (
    <p className="select-promptMessage">Select a message to view content.</p>
  )}
</div>
    </div>
  );
}

function ProgressView({ currentManagerID }: { currentManagerID: string | null }) {
  const [data, setData] = useState<EmployeeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!currentManagerID) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/teamProgress?managerID=${currentManagerID}`);
        const report = await res.json();
        setData(report);
      } catch (err) {
        console.error("Error loading progress", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [currentManagerID]);

  // Derived Summary Stats
  const overall = data.reduce(
    (acc, curr) => ({
      total: acc.total + curr.total,
      completed: acc.completed + curr.completed,
    }),
    { total: 0, completed: 0 }
  );

  const getPercentage = (completed: number, total: number) => 
    total === 0 ? 0 : Math.round((completed / total) * 100);

  if (loading) return <div className="cobox">
    <div className="teamSpinner"></div>
    <p className="loadingTeamMetrics">Loading team metrics...</p>
    </div>;

  return (
    <div className="coboxContainer">
      <div className="progress-view-container">
        <div className="progress-header"><h2>Team Progress Dashboard</h2></div>
        <div className="progress-grid">
          
          {/* TEAM SUMMARY CARD */}
          <div className="progress-card summary">
            <h3 className="emp-name">Total Team Output</h3>
            <div className="progress-stat">
              <span className="stat-label">Tasks Completed</span>
              <span className="stat-number">
                {overall.completed} / {overall.total}
              </span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill high" style={{ width: `${getPercentage(overall.completed, overall.total)}%` }}></div>
            </div>
          </div>

          {/* INDIVIDUAL CARDS */}
          {data.map((emp) => {
            const pct = getPercentage(emp.completed, emp.total);
            return (
              <div className="progress-card" key={emp.empID}>
                <h3 className="emp-name">{emp.name}</h3>
                <p className="emp-id">ID: {emp.empID}</p>
                <div className="progress-stat">
                  <span className="stat-label">Completion</span>
                  <span className="stat-number">{emp.completed} / {emp.total}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className={`progress-bar-fill ${pct < 40 ? 'low' : pct < 80 ? 'med' : 'high'}`} 
                       style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
