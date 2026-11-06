"use client";

import { useActionState } from "react";
import { submitContact, submitStore, type FormState } from "@/app/actions";
import { PLATFORMS } from "@/lib/platforms";

const initial: FormState = { status: "idle", message: "" };
const field =
  "w-full rounded-2xl border border-[#d5dbe3] bg-white px-4 py-3 text-[#090b10] outline-none";

function Note({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p className={state.status === "ok" ? "text-sm text-[#0b6b3a]" : "text-sm text-[#9b1c1c]"}>
      {state.message}
    </p>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block text-sm font-medium">
        Name
        <input name="name" required className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input name="email" type="email" required className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-medium">
        Message
        <textarea name="message" required rows={5} className={`${field} mt-1`} />
      </label>
      <Note state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#155eef] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Sending" : "Send"}
      </button>
    </form>
  );
}

export function SubmitStoreForm() {
  const [state, action, pending] = useActionState(submitStore, initial);
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block text-sm font-medium">
        Your name
        <input name="name" className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input name="email" type="email" className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-medium">
        Store name
        <input name="storeName" required className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-medium">
        Street address
        <input name="address" required className={`${field} mt-1`} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          City
          <input name="city" required className={`${field} mt-1`} />
        </label>
        <label className="block text-sm font-medium">
          Country
          <input name="country" required className={`${field} mt-1`} />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Region or state
        <input name="region" className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-medium">
        Phone
        <input name="phone" className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-medium">
        Website
        <input name="website" className={`${field} mt-1`} />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Platforms</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PLATFORMS.map((platform) => (
            <label key={platform.slug} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={`platform-${platform.label}`} />
              {platform.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium">Also true</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="sellsNew" /> Sells new games
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="sellsUsed" /> Sells used games
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="tradeIns" /> Accepts trade-ins
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="repairs" /> Repairs consoles
          </label>
        </div>
      </fieldset>
      <label className="block text-sm font-medium">
        Notes
        <textarea name="message" rows={4} className={`${field} mt-1`} />
      </label>
      <Note state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#155eef] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Sending" : "Submit store"}
      </button>
    </form>
  );
}
