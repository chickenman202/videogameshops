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
      message: "The note could not be saved. Try again in a little while.",
    };
  }
  const { error } = await supabase.from("inbox_messages").insert(row);
  if (error) {
    console.error(error.message);
    return { status: "error", message: "That could not be saved. Please try again." };
  }
  return {
    status: "ok",
    message:
      row.kind === "store_submission"
        ? "Received. A person reads the note before the shop is listed."
        : "Received. We will use it to check the listing.",
  };
}

export async function submitContact(_previous: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name", 120);
  const email = text(formData, "email", 180);
  const message = text(formData, "message", 2000);
  if (name.length < 2 || !emailOk(email) || message.length < 10) {
    return { status: "error", message: "Add your name, a complete email, and a short message." };
  }
  return saveMessage({ kind: "contact", name, email, message });
}

export async function submitStore(_previous: FormState, formData: FormData): Promise<FormState> {
  const storeName = text(formData, "storeName", 160);
  const address = text(formData, "address", 200);
  const city = text(formData, "city", 80);
  const country = text(formData, "country", 80);
  const region = text(formData, "region", 80);
  const usState = getStateFromInput(region);
  const email = text(formData, "email", 180);
  const phone = text(formData, "phone", 40);
  const website = text(formData, "website", 200);
  const note = text(formData, "message", 2000);
  const platforms = PLATFORMS.map((platform) => platform.label).filter(
    (label) => formData.get(`platform-${label}`) === "on",
  );

  if (storeName.length < 2 || address.length < 4 || city.length < 2 || country.length < 2) {
    return {
      status: "error",
      message: "Store name, street address, city, and country are required.",
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
    state: usState?.name || region || country,
    phone: phone || null,
    website: website || null,
    platforms,
    sells_new: formData.get("sellsNew") === "on",
    sells_used: formData.get("sellsUsed") === "on",
    accepts_trade_ins: formData.get("tradeIns") === "on",
    repairs_consoles: formData.get("repairs") === "on",
    message: [note, `Country: ${country}`].filter(Boolean).join("\n\n") || null,
  });
}
