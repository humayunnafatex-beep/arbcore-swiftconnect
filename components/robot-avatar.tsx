"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type RobotAvatarProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  imageSrc?: string;
};

const sizes = {
  sm: "h-11 w-11",
  md: "h-14 w-14",
  lg: "h-20 w-20"
};

const imagePadding = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-2.5"
};

export function RobotAvatar({ size = "md", className, imageSrc = "/arbcore-ai-robot.png" }: RobotAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-blue-100 bg-white shadow-glow",
        sizes[size],
        imagePadding[size],
        className
      )}
      aria-label="ARBCore AI assistant"
    >
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_24%,rgba(80,180,255,0.18),transparent_40%),linear-gradient(180deg,#ffffff,#eff6ff)]" />
      {!imageFailed ? (
        <img
          src={imageSrc}
          alt="ARBCore AI tiny robot"
          className="relative z-10 h-full w-full object-contain drop-shadow-[0_10px_18px_rgba(25,87,255,0.25)]"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="relative z-10 grid h-[72%] w-[78%] place-items-center rounded-[18px] border border-blue-200 bg-gradient-to-b from-slate-950 to-blue-950">
          <span className="absolute left-[22%] top-[35%] h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,1)]" />
          <span className="absolute right-[22%] top-[35%] h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,1)]" />
          <span className="absolute bottom-[25%] h-1.5 w-6 rounded-full border-b-2 border-cyan-200" />
        </span>
      )}
    </div>
  );
}
