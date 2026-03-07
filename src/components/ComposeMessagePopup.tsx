"use client";

import { Button } from "@/components/ui/button";

type Props = {
  userEmail: string;
  onClose: () => void;
  fixedType: "message" | "invite";
};

export default function ComposeMessagePopup({ onClose }: Props) {
  return (
    <div
      className="modalOverlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modalBox">
        <h3>Messaging</h3>
        <p style={{ marginTop: "8px", marginBottom: "16px" }}>
          Messaging is not available yet
        </p>

        <div className="flex gap-2 justify-end mt-4 px-4 py-3 rounded-md">
          <Button variant="popup" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}