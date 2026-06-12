/**
 * 浏览器直传 R2：先向 /api/upload/presign 要预签名 PUT URL，再把文件本体
 * 直接 PUT 到 R2。绕开 Vercel 函数 4.5MB 请求体硬上限（/api/upload 传大 PDF
 * 会被平台 413）。需要 R2 桶配置允许站点域名 PUT 的 CORS 规则。
 */
export async function uploadDirect(file: File): Promise<string> {
  const contentType = file.type || "application/octet-stream";
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: contentType,
      fileSize: file.size,
    }),
  });
  const data = (await res.json().catch(() => null)) as
    | { uploadUrl?: string; url?: string; error?: string }
    | null;
  if (!res.ok || !data?.uploadUrl || !data?.url) {
    throw new Error(data?.error ?? `presign ${res.status}`);
  }

  // Content-Type 参与了签名，必须与 presign 时一致
  const put = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!put.ok) throw new Error(`R2 PUT ${put.status}`);
  return data.url;
}
