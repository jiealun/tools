const PUBLIC_DOWNLOAD_BASE = 1200

export function getPublicDownloadCount(downloadCount: number | null | undefined) {
  const actualCount = Number.isFinite(downloadCount) ? Math.max(0, Math.floor(downloadCount || 0)) : 0
  return PUBLIC_DOWNLOAD_BASE + actualCount
}
