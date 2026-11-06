"use server";

import type { Database } from "@/lib/database.types";
import { PLATFORMS } from "@/lib/platforms";
import { getStateFromInput } from "@/lib/states";
import { createServiceClient } from "@/lib/supabase";

export type FormState = { status: "idle" | "ok" | "error"; message: string };

type InboxInsert = Database["public"]["Tables"]["inbox_messages"]["Insert"];

function text(formData: FormData, key: string, max: number): string {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function emailOk(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function saveMessage(row: InboxInsert): Promise<FormState> {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Nothing was saved. Please try again later.",
    };
  }
  const { error } = await supabase.from("inbox_messages").insert(row);
  if (error) {
    console.error(error.message);
    return { status: "error", message: "That could not be saved. Please try again." };
  }
  return {
    status: "ok",
    message: "Saved. We review it before anything goes on the public site.",
  };
}

export async function submitContact(_previous: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name", 120);
  const email = text(formData, "email", 180);
  const message = text(formData, "message", 2000);
  if (name.length < 2 || !emailOk(email) || message.length < 10) {
    return { status: "error", message: "Add your name, an email address, and a short message." };
  }
  return saveMessage({ kind: "contact", name, email, message });
}

export async function submitStore(_previous: FormState, formData: FormData): Promise<FormState> {
  const storeName = text(formData, "storeName", 160);
  const address = text(formData, "address", 200);
  const city = text(formData, "city", 80);
  const state = getStateFromInput(text(formData, "state", 80));
  const email = text(formData, "email", 180);
  const phone = text(formData, "phone", 40);
  const website = text(formData, "website", 200);
  const note = text(formData, "message", 2000);
  const platforms = PLATFORMS.map((platform) => platform.label).filter(
    (label) => formData.get(`platform-${label}`) === "on",
  );

  if (storeName.length < 2 || address.length < 4 || city.length < 2 || !state) {
    return {
      status: "error",
      message: "Store name, street address, city, and state are required.",
    };
  }
  if (email && !emailOk(email)) {
    return { status: "error", message: "That email does not look complete." };
  }

  return saveMessage({
    kind: "store_submission",
    name: text(formData, "name", 120) || null,
    email: email || null,
    store_name: storeName,
    address,
    city,
    state: state.name,
    phone: phone || null,
    website: website || null,
    platforms,
    sells_new: formData.get("sellsNew") === "on",
    sells_used: formData.get("sellsUsed") === "on",
    accepts_trade_ins: formData.get("tradeIns") === "on",
    repairs_consoles: formData.get("repairs") === "on",
    message: note || null,
  });
}
