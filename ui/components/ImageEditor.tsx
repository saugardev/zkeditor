"use client";

import { useImageEditor } from "@/hooks/useImageEditor";
import { useState } from "react";
import {
  Hand,
  Wand2,
  RotateCw,
  FlipHorizontal2,
  SunMedium,
  Contrast,
  Droplet,
  Type,
  SquareDashed,
  Menu,
  Crop,
  X,
} from "lucide-react";
import { TransformPanel } from "@/components/TransformPanel";
import { ImageCanvas } from "@/components/ImageCanvas";
import { Navbar } from "./Navbar";
import { useTabs } from "@/contexts/TabsContext";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface RegionSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

const tools = [
  { icon: Hand, name: "Upload", type: "upload" },
  { icon: SquareDashed, name: "Selection", type: "selection" },
  { icon: Crop, name: "Crop", type: "Crop" },
  { icon: Wand2, name: "Grayscale", type: "Grayscale" },
  { icon: RotateCw, name: "Rotate", type: "Rotate90" },
  { icon: FlipHorizontal2, name: "Flip", type: "FlipHorizontal" },
  { icon: SunMedium, name: "Brighten", type: "Brighten" },
  { icon: Contrast, name: "Contrast", type: "Contrast" },
  { icon: Droplet, name: "Blur", type: "Blur" },
  { icon: Type, name: "Text", type: "text" },
];

export default function ImageEditor() {
  const {
    tabs,
    activeTab,
    isLoading,
    setActiveTab,
    updateTabState,
    reorderTabs,
    undo,
    redo,
    removeTab,
  } = useTabs();
  const { applyTransformation, exportImage } = useImageEditor();
  const [selectedTool, setSelectedTool] = useState<string | null>("Hand");
  const [isTabLoading, setIsTabLoading] = useState(false);

  const handleTransform = async (
    type: string,
    value?: number,
    paramName?: string,
    region?: RegionSelection
  ) => {
    try {
      console.log("Starting transformation:", {
        type,
        value,
        paramName,
        region,
      });
      setIsTabLoading(true);
      const noRegionTransforms = ["Rotate90", "Rotate180", "Rotate270"];

      const currentSelection = tabs[activeTab]?.selection;

      let transformation;
      if (type === "Brighten") {
        transformation = {
          Brighten: {
            value,
            region: currentSelection
              ? {
                  x: Math.round(currentSelection.x),
                  y: Math.round(currentSelection.y),
                  width: Math.round(currentSelection.width),
                  height: Math.round(currentSelection.height),
                }
              : null,
          },
        };
      } else if (type === "Contrast") {
        transformation = {
          Contrast: {
            contrast: value,
            region: currentSelection
              ? {
                  x: Math.round(currentSelection.x),
                  y: Math.round(currentSelection.y),
                  width: Math.round(currentSelection.width),
                  height: Math.round(currentSelection.height),
                }
              : null,
          },
        };
      } else if (type === "Blur") {
        transformation = {
          Blur: {
            sigma: value,
            region: currentSelection
              ? {
                  x: Math.round(currentSelection.x),
                  y: Math.round(currentSelection.y),
                  width: Math.round(currentSelection.width),
                  height: Math.round(currentSelection.height),
                }
              : null,
          },
        };
      } else if (type === "Crop" && region) {
        transformation = {
          Crop: {
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height,
          },
        };
      } else {
        transformation = {
          [type]: noRegionTransforms.includes(type)
            ? null
            : {
                region: currentSelection
                  ? {
                      x: Math.round(currentSelection.x),
                      y: Math.round(currentSelection.y),
                      width: Math.round(currentSelection.width),
                      height: Math.round(currentSelection.height),
                    }
                  : null,
              },
        };
      }

      console.log("Transformation object:", transformation);
      console.log("Current tab:", activeTab);
      console.log("Current tab image:", tabs[activeTab]?.imageUrl);

      const newUrl = await applyTransformation(transformation, activeTab);
      console.log("New URL after transformation:", newUrl);

      if (newUrl) {
        updateTabState(activeTab, {
          imageUrl: newUrl,
          transformations: [
            ...(tabs[activeTab].transformations || []),
            {
              type,
              params: value
                ? { [paramName || "value"]: value }
                : region
                ? {
                    region: {
                      x: Math.round(region.x),
                      y: Math.round(region.y),
                      width: Math.round(region.width),
                      height: Math.round(region.height),
                    },
                  }
                : undefined,
              timestamp: Date.now(),
            },
          ],
        });
      }
    } catch (error) {
      console.error("Transform failed:", error);
    } finally {
      setIsTabLoading(false);
    }
  };

  const handleTextOverlay = async (params: {
    TextOverlay: {
      text: string;
      x: number;
      y: number;
      size: number;
      color: string;
    };
  }) => {
    try {
      setIsTabLoading(true);
      const newUrl = await applyTransformation(params, activeTab);
      if (newUrl) {
        updateTabState(activeTab, { imageUrl: newUrl });
      }
    } catch (error) {
      console.error("Text overlay failed:", error);
    } finally {
      setIsTabLoading(false);
    }
  };

  const handleExport = async () => {
    const url = await exportImage(
      selectedTool === "png" ? "png" : "jpeg",
      activeTab
    );
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = `edited-image.${selectedTool === "png" ? "png" : "jpeg"}`;
      link.click();
    }
  };

  const handleToolClick = (toolType: string) => {
    setSelectedTool(toolType);
  };

  const handleZoomChange = (newZoom: number) => {
    updateTabState(activeTab, { zoom: newZoom });
  };

  const handlePanChange = (newPan: { x: number; y: number }) => {
    updateTabState(activeTab, { pan: newPan });
  };

  const handleSelectionChange = (newSelection: RegionSelection | null) => {
    updateTabState(activeTab, { selection: newSelection });
  };

  const handleTabSwitch = async (index: number) => {
    setIsTabLoading(true);
    setActiveTab(index);
    await new Promise((resolve) => setTimeout(resolve, 100));
    setIsTabLoading(false);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newTabs = Array.from(tabs);
    const [reorderedTab] = newTabs.splice(result.source.index, 1);
    newTabs.splice(result.destination.index, 0, reorderedTab);

    const newActiveTab =
      result.source.index === activeTab ? result.destination.index : activeTab;

    setActiveTab(newActiveTab);
    reorderTabs(newTabs);
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        <div className="w-16 bg-neutral-900 flex flex-col gap-2 p-2 border-r border-neutral-700">
          {tools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => handleToolClick(tool.type)}
              className={`p-2 rounded-lg transition-colors flex items-center justify-center${
                selectedTool === tool.type
                  ? " bg-neutral-800 text-white"
                  : " text-neutral-400 hover:bg-neutral-800"
              }`}
              title={tool.name}
            >
              <tool.icon size={20} />
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          {tabs.length > 0 && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="tabs" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex border-b border-neutral-700 bg-neutral-900"
                  >
                    {tabs.map((tab, index) => (
                      <Draggable
                        key={tab.id || `tab-${index}`}
                        draggableId={tab.id || `tab-${index}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <div
                              className={`px-4 py-2 flex items-center gap-2 text-neutral-400 text-sm group ${
                                activeTab === index
                                  ? "bg-neutral-800"
                                  : "hover:bg-neutral-800"
                              }`}
                            >
                              <button
                                onClick={() => handleTabSwitch(index)}
                                className="flex items-center gap-2 flex-1 min-w-0"
                              >
                                <Menu size={14} />
                                <span className="truncate">{tab.name}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTab(index);
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          <div className="flex-1 flex">
            <div className="flex-1 bg-neutral-800 relative overflow-hidden">
              <ImageCanvas
                imageUrl={tabs[activeTab]?.imageUrl}
                zoom={tabs[activeTab]?.zoom ?? 1}
                pan={tabs[activeTab]?.pan ?? { x: 0, y: 0 }}
                onZoomChange={handleZoomChange}
                onPanChange={handlePanChange}
                selection={tabs[activeTab]?.selection ?? null}
                onSelectionChange={handleSelectionChange}
                isLoading={isLoading || isTabLoading}
                selectedTool={selectedTool}
                activeTab={activeTab}
                tabs={tabs}
                onToolSelect={handleToolClick}
                onCopy={() => {
                  const img = document.querySelector(
                    `img[data-tab="${activeTab}"]`
                  ) as HTMLImageElement;
                  if (img?.src) {
                    navigator.clipboard.write([
                      new ClipboardItem({
                        "image/png": fetch(img.src).then((r) => r.blob()),
                      }),
                    ]);
                  }
                }}
                undo={undo}
                redo={redo}
              />
            </div>

            <div className="w-64 bg-neutral-900 p-4 flex flex-col gap-4 border-l border-neutral-700">
              <TransformPanel
                selectedTool={selectedTool}
                onTransform={handleTransform}
                onTextOverlay={handleTextOverlay}
                onExport={handleExport}
                selection={tabs[activeTab]?.selection ?? null}
                onSelectionChange={handleSelectionChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
