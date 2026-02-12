import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          borderRadius: 40,
          position: "relative",
        }}
      >
        {/* Radar rings */}
        <div
          style={{
            position: "absolute",
            width: 130,
            height: 130,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 85,
            height: 85,
            borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        {/* Radar dot */}
        <div
          style={{
            position: "absolute",
            top: 32,
            right: 42,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#4ade80",
            boxShadow: "0 0 8px rgba(74,222,128,0.6)",
          }}
        />
        {/* S letter */}
        <span
          style={{
            fontSize: 100,
            fontWeight: 800,
            color: "white",
            lineHeight: 1,
            letterSpacing: -3,
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
