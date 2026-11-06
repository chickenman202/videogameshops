"use client";

import { useActionState } from "react";
import { submitContact, submitStore, type FormState } from "@/app/actions";
import { PLATFORMS } from "@/lib/platforms";
import { US_STATES } from "@/lib/states";

const initial: FormState = { status: "idle", message: "" };

function Note({ state }: { state: FormState }) {
  if (!state.message) return null;
  const ok = state.status === "ok";
  return (
    <p
      role={ok ? "status" : "alert"}
      className={
        ok
          ? "border-l-4 border-ok bg-card px-4 py-3 text-sm font-semibold text-ok"
          : "border-l-4 border-danger bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
      }
    >
      {state.message}
    </p>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">
        {label}
        {required ? (
          <span className="text-signal" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </span>
      <input name={name} type={type} required={required} autoComplete={autoComplete} className="field mt-1.5" />
    </label>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);
  return (
    <form action={action} aria-busy={pending || undefined} className="mt-8 space-y-4 border-t border-ink pt-6">
      <Field label="Name" name="name" required autoComplete="name" />
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <label className="block">
        <span className="text-sm font-bold text-ink">
          Message
          <span className="text-signal" aria-hidden="true">
            {" "}
            *
          </span>
        </span>
        <textarea name="message" required rows={5} className="field mt-1.5" />
      </label>
      <Note state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full sm:w-auto">
        {pending ? "Sending" : "Send"}
      </button>
    </form>
  );
}

export function SubmitStoreForm() {
  const [state, action, pending] = useActionState(submitStore, initial);
  return (
    <form action={action} aria-busy={pending || undefined} className="mt-8 space-y-6">
      <p className="text-sm text-muted">Fields with a star are required.</p>
      <section className="border-t border-ink pt-6">
        <h2 className="text-2xl text-ink">About you</h2>
        <div className="mt-4 space-y-4">
          <Field label="Your name" name="name" autoComplete="name" />
          <Field label="Email" name="email" type="email" autoComplete="email" />
        </div>
      </section>
      <section className="border-t border-ink pt-6">
        <h2 className="text-2xl text-ink">The shop</h2>
        <div className="mt-4 space-y-4">
          <Field label="Store name" name="storeName" required autoComplete="organization" />
          <Field label="Street address" name="address" required autoComplete="street-address" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" name="city" required autoComplete="address-level2" />
            <label className="block">
              <span className="text-sm font-bold text-ink">
                State
                <span className="text-signal" aria-hidden="true">
                  {" "}
                  *
                </span>
              </span>
              <select name="state" required autoComplete="address-level1" className="field mt-1.5" defaultValue="">
                <option value="" disabled>
                  Choose a state
                </option>
                {US_STATES.map((state) => (
                  <option key={state.slug} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
          <Field label="Website" name="website" autoComplete="url" />
        </div>
      </section>
      <section className="border-t border-ink pt-6">
        <h2 className="text-2xl text-ink">What the shop carries</h2>
        <fieldset className="mt-4">
          <legend className="text-sm font-bold text-ink">Platforms</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {PLATFORMS.map((platform) => (
              <label
                key={platform.slug}
                className="flex min-h-11 items-center gap-3 border border-ink px-3 text-sm font-semibold has-[:checked]:bg-ink has-[:checked]:text-paper"
              >
                <input type="checkbox" name={`platform-${platform.label}`} />
                {platform.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-5">
          <legend className="text-sm font-bold text-ink">Also true</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Choice name="sellsNew" label="Sells new games" />
            <Choice name="sellsUsed" label="Sells used games" />
            <Choice name="tradeIns" label="Accepts trade-ins" />
            <Choice name="repairs" label="Repairs consoles" />
          </div>
        </fieldset>
        <label className="mt-5 block">
          <span className="text-sm font-bold text-ink">Notes</span>
          <textarea name="message" rows={4} className="field mt-1.5" />
        </label>
      </section>
      <Note state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full sm:w-auto">
        {pending ? "Sending" : "Submit store"}
      </button>
    </form>
  );
}

function Choice({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex min-h-11 items-center gap-3 border border-ink px-3 text-sm font-semibold has-[:checked]:bg-ink has-[:checked]:text-paper">
      <input type="checkbox" name={name} />
      {label}
    </label>
  );
}
