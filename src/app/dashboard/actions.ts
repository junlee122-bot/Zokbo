"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { updateFileMeta, deleteFilePage, type FileMeta } from "@/lib/notion";
import type { FileVisibility } from "@/lib/constants";

interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface MetaInput {
  title: string;
  subject: string;
  grade: string;
  year: string;
  semester: string;
  examType: string;
  tags: string;
  description: string;
  visibility: FileVisibility;
}

export async function updateFileAction(id: string, input: MetaInput): Promise<ActionResult> {
  if (!(await isAuthenticated())) return { ok: false, error: "인증이 필요합니다." };

  const meta: FileMeta = {
    title: input.title.trim() || "(제목 없음)",
    subject: input.subject.trim(),
    grade: input.grade.trim(),
    year: input.year.trim(),
    semester: input.semester,
    examType: input.examType,
    tags: input.tags.split(",").map((t) => t.trim()).filter(Boolean),
    description: input.description.trim(),
    visibility: input.visibility,
  };

  try {
    await updateFileMeta(id, meta);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  revalidatePath(`/dashboard/files/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteFileAction(id: string): Promise<ActionResult> {
  if (!(await isAuthenticated())) return { ok: false, error: "인증이 필요합니다." };
  try {
    await deleteFilePage(id);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}
