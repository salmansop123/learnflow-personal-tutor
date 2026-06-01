"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send your message");
      }

      toast.success("Thanks! We received your message and will reply soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      toastError(err, "Failed to send your message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          maxLength={120}
          autoComplete="name"
          className="shadow-none"
        />
      </div>

      <div className="space-y-2 shadow-none">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          className="shadow-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Your question</Label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What would you like to ask us?"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          className={cn(
            "flex w-full resize-y rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground shadow-none transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
