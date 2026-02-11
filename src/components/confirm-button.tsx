"use client";

import { useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface ConfirmButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  message?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning" | "info";
}

export function ConfirmButton({
  message,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  onClick,
  disabled,
  ...props
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const parsed = useMemo(() => {
    if (title || description) {
      return { title, description };
    }
    if (!message) {
      return { title: "Are you sure?", description: undefined };
    }
    const [first, ...rest] = message.split(/\n\n+/);
    const parsedTitle = first || "Are you sure?";
    const parsedDescription = rest.length > 0 ? rest.join("\n\n") : undefined;
    return { title: parsedTitle, description: parsedDescription };
  }, [message, title, description]);

  function handleTriggerClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }

  function handleConfirm() {
    setOpen(false);
    if (onClick) {
      const synthetic = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });
      onClick(synthetic as unknown as React.MouseEvent<HTMLButtonElement>);
      return;
    }
    if (buttonRef.current?.form) {
      buttonRef.current.form.requestSubmit(buttonRef.current);
    }
  }

  return (
    <>
      <button
        {...props}
        ref={buttonRef}
        onClick={handleTriggerClick}
        disabled={disabled}
      />
      <ConfirmDialog
        open={open}
        title={parsed.title ?? "Are you sure?"}
        description={parsed.description}
        confirmLabel={confirmLabel ?? "Confirm"}
        cancelLabel={cancelLabel ?? "Cancel"}
        tone={tone}
        onConfirm={handleConfirm}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
