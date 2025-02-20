import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTabs } from "@/contexts/TabsContext";
import { useImageEditor } from "@/hooks/useImageEditor";
import { useToast } from "@/contexts/ToastContext";
import { UploadModal } from "./UploadModal";
import { InfoModal } from "./InfoModal";
import { ConnectButton } from "./ConnectButton";

interface MenuItem {
  label: string;
  items: {
    label: string;
    action: () => void;
  }[];
}

export function Navbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const {
    addTab,
    setIsLoading,
    tabs,
    activeTab,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTabs();
  const { loadImage } = useImageEditor();
  const { showToast } = useToast();

  const handleNewProject = async (
    file: File,
    ipfsCid?: string,
    signature?: string
  ) => {
    try {
      setIsLoading(true);
      const project = await loadImage(file, tabs.length);
      const initialImage = await project.get_layer(0);
      const imageUrl = URL.createObjectURL(
        new Blob([initialImage], { type: "image/png" })
      );

      addTab({
        id: `tab-${Date.now()}`,
        name: file.name,
        imageUrl,
        history: [imageUrl],
        historyIndex: 0,
        transformations: [],
        ipfsCid,
        signature,
      });
      showToast("Project created successfully");
    } catch (error) {
      console.error("Failed to create project:", error);
      showToast("Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems: MenuItem[] = [
    {
      label: "File",
      items: [
        {
          label: "New Project",
          action: () => setShowUploadModal(true),
        },
        {
          label: "Open...",
          action: () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                handleNewProject(file);
              }
            };
            input.click();
          },
        },
        { label: "Save", action: () => console.log("Save") },
        { label: "Export", action: () => console.log("Export") },
      ],
    },
    {
      label: "Edit",
      items: [
        {
          label: "Undo",
          action: () => {
            if (canUndo(activeTab)) {
              undo(activeTab);
              showToast("Undo successful");
            } else {
              showToast("No image to undo");
            }
          },
        },
        {
          label: "Redo",
          action: () => {
            if (canRedo(activeTab)) {
              redo(activeTab);
              showToast("Redo successful");
            } else {
              showToast("No image to redo");
            }
          },
        },
        {
          label: "Copy",
          action: async () => {
            const img = document.querySelector(
              `img[data-tab="${activeTab}"]`
            ) as HTMLImageElement;
            if (img?.src) {
              try {
                const response = await fetch(img.src);
                const blob = await response.blob();
                await navigator.clipboard.write([
                  new ClipboardItem({
                    [blob.type]: blob,
                  }),
                ]);
                showToast("Image copied to clipboard");
              } catch (error) {
                console.error("Failed to copy image:", error);
                showToast("Failed to copy image");
              }
            } else {
              showToast("No image to copy");
            }
          },
        },
      ],
    },
    {
      label: "Filters",
      items: [
        { label: "Grayscale", action: () => console.log("Grayscale") },
        { label: "Blur", action: () => console.log("Blur") },
        { label: "Sharpen", action: () => console.log("Sharpen") },
        { label: "Invert", action: () => console.log("Invert") },
      ],
    },
    {
      label: "Help",
      items: [
        {
          label: "Image Info",
          action: () => {
            if (tabs[activeTab]?.imageUrl) {
              setShowInfoModal(true);
            } else {
              showToast("No image to show information for");
            }
          },
        },
        { label: "Documentation", action: () => console.log("Docs") },
        { label: "About", action: () => console.log("About") },
      ],
    },
  ];

  return (
    <>
      <nav className="bg-neutral-900 border-b text-white border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex">
            {menuItems.map((menu) => (
              <div
                key={menu.label}
                className="relative"
                onMouseEnter={() => setActiveMenu(menu.label)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button className="px-4 py-2 hover:bg-neutral-800 flex items-center gap-1">
                  {menu.label}
                  <ChevronDown size={14} />
                </button>

                {activeMenu === menu.label && (
                  <div className="absolute top-full left-0 bg-neutral-900 border border-neutral-700 shadow-lg min-w-40 py-1 z-50">
                    {menu.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="w-full px-4 py-2 text-left hover:bg-neutral-800"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <ConnectButton />
        </div>
      </nav>

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImageSelect={handleNewProject}
      />

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        imageInfo={
          tabs[activeTab]?.imageUrl
            ? {
                name: tabs[activeTab].name,
                dimensions: {
                  width:
                    (
                      document.querySelector(
                        `img[data-tab="${activeTab}"]`
                      ) as HTMLImageElement
                    )?.naturalWidth || 0,
                  height:
                    (
                      document.querySelector(
                        `img[data-tab="${activeTab}"]`
                      ) as HTMLImageElement
                    )?.naturalHeight || 0,
                },
                ipfsCid: tabs[activeTab].ipfsCid,
                signature: tabs[activeTab].signature,
              }
            : null
        }
      />
    </>
  );
}
