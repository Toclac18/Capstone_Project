// src/app/contact-admin/api.ts

import {
  changeReaderAccess,
  fetchReaders,
  ReaderAccessPayload,
  ReaderResponse,
} from "src/services/orgAdmin-reader";

export {
  fetchReaders,
  changeReaderAccess,
  type ReaderAccessPayload,
  type ReaderResponse,
} from "@/services/orgAdmin-reader";

export async function postJSON(
  payload: ReaderAccessPayload,
): Promise<ReaderResponse> {
  return changeReaderAccess(payload);
}

export async function getJSON(): Promise<ReaderResponse> {
  const data = await fetchReaders();
  if (!data.items || data.items.length === 0) {
    throw new Error("Reader list is empty");
  }
  return data.items[0];
}
