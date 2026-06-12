import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { presignR2Put } from "@/lib/r2";
import { errMsg } from "@/lib/admin-err";
import {
  MAX_UPLOAD_BYTES,
  BLOCKED_TYPES,
  BLOCKED_EXT,
  safeExt,
} from "@/lib/upload-rules";

/**
 * 浏览器直传 R2 的预签名接口：只收文件元信息，返回限时 PUT URL + 最终公开 URL。
 * 与 /api/upload 同一套安全白名单；大小靠声明值校验——直传通道防不了谎报，
 * 但 R2 公开桶本就有 25MB 经服务器的同等上限，谎报者也只是占自己的存储配额。
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: await errMsg("unauthorized") }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  } | null;
  if (!body?.fileName) {
    return NextResponse.json({ error: await errMsg("fileMissing") }, { status: 400 });
  }
  if (typeof body.fileSize === "number" && body.fileSize > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: await errMsg("fileTooLarge25m") }, { status: 413 });
  }

  const type = body.fileType || "application/octet-stream";
  const ext = safeExt(body.fileName);
  if (BLOCKED_TYPES.has(type) || BLOCKED_EXT.has(ext)) {
    return NextResponse.json({ error: await errMsg("unsupportedFileType") }, { status: 415 });
  }

  const key = `${randomUUID()}.${ext}`;
  const { uploadUrl, url } = await presignR2Put(key, type);
  return NextResponse.json({ uploadUrl, url });
}
