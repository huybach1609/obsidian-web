"use client";
import { Button, ButtonGroup, Modal, toast, Toolbar } from "@heroui/react";
import {
  AlignLeft,
  DownloadIcon,
  EyeIcon,
  PanelLeftIcon,
  PencilIcon,
  WrapText,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";

import axios from "@/lib/axios";
import AnimatedContent from "@/app/_components/AnimatedContent";
import Header from "@/app/_components/Header";
import { getFileMarkdown, toggleCheckbox } from "@/services/fileservice";
import { MarkdownContent } from "@/lib/markdown/MarkdownContent";
import { useAppSettings } from "@/contexts/AppContext";
import { siteConfig } from "@/config/site";
import { getVaultImageUrl, isVaultImagePath } from "@/lib/parseObsidian";
import { usePlatform } from "@/contexts/PlatformContext";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { decodePathParam } from "@/utils/stringhelper";

import "../../../styles/markdown.css";

function mimeTypeForImageFilename(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();

  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export default function NotesPage() {
  const params = useParams();
  const router = useRouter();
  const filePath = decodePathParam(
    params.path as string | string[] | undefined,
  );
  const { isMobile, isWebView } = usePlatform();
  const sidebar = useSidebarContext();
  const { fileIndex } = useAppSettings();

  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [textWrap, setTextWrap] = useState(true);
  const previewAreaRef = useRef<HTMLDivElement>(null);

  const loadPreview = useCallback(async () => {
    if (!filePath) return;
    if (isVaultImagePath(filePath)) {
      setMarkdown("");
      setLoading(false);

      return;
    }
    setLoading(true);
    try {
      const { markdown: md } = await getFileMarkdown(filePath);

      setMarkdown(md);
    } catch (error) {
      console.error("Error loading file:", error);
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  // Attach checkbox click handlers after content is rendered
  useEffect(() => {
    if (!previewAreaRef.current || !filePath || isVaultImagePath(filePath))
      return;

    const handleCheckboxClick = async (event: MouseEvent) => {
      const target = event.target as HTMLInputElement;

      if (
        target.type === "checkbox" &&
        target.hasAttribute("data-interactive")
      ) {
        event.preventDefault();

        // Find the parent list item and extract text
        const listItem = target.closest("li");

        if (!listItem) return;

        // Get text content of the list item, excluding the checkbox
        const textNode = listItem.cloneNode(true) as HTMLElement;
        const checkbox = textNode.querySelector('input[type="checkbox"]');

        if (checkbox) {
          checkbox.remove();
        }
        const checkboxText = textNode.textContent?.trim() || "";

        if (!checkboxText) return;

        // Toggle the checkbox
        try {
          await toggleCheckbox(filePath, checkboxText);
          // Reload preview to show updated state
          await loadPreview();
        } catch (error) {
          console.error("Error toggling checkbox:", error);
        }
      }
    };

    const previewArea = previewAreaRef.current;

    previewArea.addEventListener("click", handleCheckboxClick);

    return () => {
      previewArea.removeEventListener("click", handleCheckboxClick);
    };
  }, [markdown, filePath, loadPreview]);

  // Update browser tab title based on fileName
  useEffect(() => {
    if (filePath) {
      const fileName = filePath.split("/").pop() || filePath;

      document.title = `${fileName} - ${siteConfig.name}`;
    } else {
      document.title = siteConfig.name;
    }

    // Cleanup: reset title when component unmounts
    return () => {
      document.title = siteConfig.name;
    };
  }, [filePath]);

  return (
    <div className="relative flex h-screen min-h-0 flex-col overflow-hidden">
      <Header className="sticky top-0 z-10 w-full shrink-0 bg-background/50 backdrop-blur-sm">
        <div className="flex w-full min-w-0 items-start justify-between gap-2 md:items-center">
          <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-2">
            <div className="flex shrink-0 items-center gap-2">
              <EyeIcon className="h-5 w-5 shrink-0" />
              <h3 className="text-lg font-semibold">Preview</h3>
            </div>
            <span className="min-w-0 truncate text-sm text-gray-500 md:max-w-[min(100%,28rem)]">
              {filePath}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Toolbar aria-label="Preview toolbar">
              {(isMobile || isWebView) && sidebar && (
                <Button
                  isIconOnly
                  aria-label="Toggle sidebar"
                  className="z-50 p-0 md:p-5"
                  size="sm"
                  variant="tertiary"
                  onPress={() => sidebar.toggleSidebar()}
                >
                  <PanelLeftIcon className="h-5 w-5" />
                </Button>
              )}
              <ButtonGroup>
                <Button
                  isIconOnly
                  aria-label={
                    textWrap ? "Disable text wrap" : "Enable text wrap"
                  }
                  className="p-0 md:p-5"
                  size="sm"
                  variant="tertiary"
                  onPress={() => setTextWrap(!textWrap)}
                >
                  {textWrap ? (
                    <WrapText className="h-5 w-5" />
                  ) : (
                    <AlignLeft className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  isIconOnly
                  aria-label="Edit"
                  className="p-0 md:p-5"
                  size="sm"
                  variant="tertiary"
                  onPress={() => router.push(`/notes/edit/${filePath}`)}
                >
                  <ButtonGroup.Separator />
                  <PencilIcon className="h-5 w-5" />
                </Button>
              </ButtonGroup>
            </Toolbar>
          </div>
        </div>
      </Header>

      <AnimatedContent animationType="blur" isContentLoading={loading}>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div
            ref={previewAreaRef}
            className={`flex-1 p-4 ${
              filePath && isVaultImagePath(filePath)
                ? "flex justify-center"
                : textWrap
                  ? "break-words whitespace-pre-wrap"
                  : "whitespace-pre overflow-x-auto no-wrap"
            }`}
            id="preview-area"
          >
            {filePath && isVaultImagePath(filePath) ? (
              <ImagePreview filePath={filePath} />
            ) : (
              <MarkdownContent fileIndex={fileIndex} markdown={markdown} />
            )}
          </div>
        </div>
      </AnimatedContent>
    </div>
  );
}
const ImagePreview = ({ filePath }: { filePath: string }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    const name = filePath.split("/").pop() || "image";
    const url = getVaultImageUrl(filePath);

    setIsDownloading(true);
    try {
      const { data } = await axios.get<ArrayBuffer>(url, {
        responseType: "arraybuffer",
      });
      const blob = new Blob([data], { type: mimeTypeForImageFilename(name) });
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = objectUrl;
      a.download = name;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast("Download started", {
        description: name,
        timeout: 2000,
        variant: "success",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast("Download failed", {
        description: "Could not fetch the image from the server.",
        timeout: 4000,
        variant: "danger",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [filePath]);

  return (
    <>
      <Modal>
        <Modal.Trigger>
          <Image
            unoptimized
            alt={filePath.split("/").pop() || ""}
            className="max-w-full max-h-[calc(100vh-8rem)] w-auto h-auto object-contain rounded-md border border-default-200"
            height={1600}
            sizes="(max-width: 768px) 100vw, min(1600px, 90vw)"
            src={getVaultImageUrl(filePath)}
            width={1600}
          />
        </Modal.Trigger>
        {/* <Button variant="secondary">Open Modal</Button> */}
        <Modal.Backdrop>
          <Modal.Container size="cover">
            <Modal.Dialog className="flex h-full max-h-[100dvh] min-h-0 flex-col overflow-hidden p-0">
              <Modal.CloseTrigger />
              <Modal.Header className="shrink-0   px-4 py-3">
                <Modal.Heading>{filePath.split("/").pop() || ""}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
                <div className="relative w-full min-h-[calc(100dvh-12rem)] flex-1 bg-content2">
                  <Image
                    fill
                    unoptimized
                    alt={filePath.split("/").pop() || ""}
                    className="object-contain"
                    sizes="100vw"
                    src={getVaultImageUrl(filePath)}
                  />
                </div>
              </Modal.Body>
              <Modal.Footer className="shrink-0 border-t border-divider px-4 py-3">
                <Button
                  className="w-fit"
                  isDisabled={isDownloading}
                  onPress={handleDownload}
                >
                  Download
                  <DownloadIcon className="h-4 w-4" />
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
};
