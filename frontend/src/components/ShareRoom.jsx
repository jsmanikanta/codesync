import React, { useState } from "react";
import toast from "react-hot-toast";

const ShareRoom = ({ roomId }) => {
  const [open, setOpen] = useState(false);
  const inviteLink = `${window.location.origin}/project/${roomId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy invite link");
    }
  };

  const shareLink = async () => {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({
        title: "Join my CodeSync room",
        url: inviteLink,
      });
    } catch (error) {
      if (error.name !== "AbortError") toast.error("Could not share room");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full rounded bg-indigo-400/90 p-1 text-black"
        onClick={() => setOpen((value) => !value)}
      >
        Share Room
      </button>
      {open && (
        <div className="absolute bottom-11 left-0 z-20 w-72 rounded-md border border-white/10 bg-[#20212c] p-3 text-white shadow-lg">
          <p className="font-semibold">Share this room</p>
          <input
            readOnly
            value={inviteLink}
            className="mt-2 text-xs"
            onFocus={(event) => event.target.select()}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="flex-1 rounded bg-[#4aed88] px-2 py-1 text-sm text-[#101117]"
            >
              Copy Link
            </button>
            {navigator.share && (
              <button
                type="button"
                onClick={shareLink}
                className="rounded bg-white/90 px-2 py-1 text-sm text-black"
              >
                Share
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareRoom;
