"use client";

import { useActionState } from "react";
import { submitContact, submitStore, type FormState } from "@/app/actions";
import { PLATFORMS } from "@/lib/platforms";

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
          <span className="text-blue-ink" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </span>
      <input name={name} type={type} required={required} autoComplete={autoComplete} className="field mt-1.5" />
    </label>
  );
}

function LineField({
  label,
  name,
  type = "text",
  required = false,
  autoComplete,
  rows,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  rows?: number;
}) {
  const control =
    "mt-2 w-full border-0 border-b-2 border-ink bg-transparent px-0 py-2 font-serif text-lg text-ink placeholder:text-muted focus:border-blue-ink";
  return (
    <label className="block">
      <span className="kicker text-ink">
        {label}
        {required ? (
          <span className="text-blue-ink" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </span>
      {rows ? (
        <textarea name={name} required={required} rows={rows} className={`${control} min-h-32 resize-y`} />
      ) : (
        <input name={name} type={type} required={required} autoComplete={autoComplete} className={control} />
      )}
    </label>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);
  return (
    <form action={action} aria-busy={pending || undefined} className="mt-8 space-y-8 border-t border-ink pt-8">
      <LineField label="Name" name="name" required autoComplete="name" />
      <LineField label="Email" name="email" type="email" required autoComplete="email" />
      <LineField label="Message" name="message" required rows={5} />
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
      <p className="text-sm text-muted">Stars mark the fields we need.</p>
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
            <Field label="Country" name="country" required autoComplete="country-name" />
          </div>
          <Field label="State or region" name="region" autoComplete="address-level1" />
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
          <legend className="text-sm font-bold text-ink">Also true of the shop</legend>
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
        {pending ? "Sending" : "Add a store"}
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
