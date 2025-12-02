// src/types/saveList.ts
import type { SaveListDocument } from "./saveListDocument";

export type SaveList = {
  id: string;
  name: string;
  docCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SaveListDetail = SaveList & {
  documents: SaveListDocument[];
};
