import { buildExportFileName, getExportExtension, getExportMimeType } from "@/lib/export-cover";
import type { ExportFormat } from "@/lib/types";

declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<{
      createWritable: () => Promise<{
        write: (data: Blob) => Promise<void>;
        close: () => Promise<void>;
      }>;
    }>;
  }
}

export async function saveBlobToUserFile(blob: Blob, fileBaseName: string, format: ExportFormat) {
  const fileName = buildExportFileName(fileBaseName, format);
  const mimeType = getExportMimeType(format);
  const isAutomatedBrowser =
    typeof navigator !== "undefined" && "webdriver" in navigator && Boolean(navigator.webdriver);

  if (typeof window !== "undefined" && window.showSaveFilePicker && !isAutomatedBrowser) {
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: `${format.toUpperCase()} cover export`,
          accept: {
            [mimeType]: [`.${getExportExtension(format)}`],
          },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return fileName;
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);

  return fileName;
}
