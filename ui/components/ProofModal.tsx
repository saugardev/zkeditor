import { useState } from "react";
import { X, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useTabs } from "@/contexts/TabsContext";
import { Transformation } from "@/types/transformations";

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BackendTransformation {
  Crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  Grayscale?: {
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  };
  Rotate90?: null;
  Rotate180?: null;
  Rotate270?: null;
  FlipVertical?: {
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  };
  FlipHorizontal?: {
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  };
  Brighten?: {
    value: number;
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  };
  Contrast?: {
    contrast: number;
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  };
  Blur?: {
    sigma: number;
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  };
  TextOverlay?: {
    text: string;
    x: number;
    y: number;
    size: number;
    color: string;
  };
}

interface ProofRequest {
  image_data: number[];
  id: string;
  transformations: BackendTransformation[];
}

interface ProofResponse {
  success: boolean;
  message: string;
  proof: string | null;
  id: string;
}

// Helper to convert frontend transformation to backend format
const mapTransformation = (t: Transformation): BackendTransformation => {
  const baseRegion = t.params?.region ? {
    region: {
      x: Math.round(t.params.region.x),
      y: Math.round(t.params.region.y),
      width: Math.round(t.params.region.width),
      height: Math.round(t.params.region.height),
    }
  } : { region: null };

  switch (t.type) {
    case "Crop":
      if (!t.params?.region) throw new Error("Crop requires region parameters");
      return {
        Crop: {
          x: Math.round(t.params.region.x),
          y: Math.round(t.params.region.y),
          width: Math.round(t.params.region.width),
          height: Math.round(t.params.region.height),
        }
      };
    case "Brighten":
      return {
        Brighten: {
          value: t.params?.value || 0,
          ...baseRegion
        }
      };
    case "Contrast":
      return {
        Contrast: {
          contrast: t.params?.contrast || 1,
          ...baseRegion
        }
      };
    case "Blur":
      return {
        Blur: {
          sigma: t.params?.sigma || 0,
          ...baseRegion
        }
      };
    case "TextOverlay":
      if (!t.params?.text) throw new Error("TextOverlay requires text parameter");
      return {
        TextOverlay: {
          text: t.params.text,
          x: Math.round(t.params.region?.x || 0),
          y: Math.round(t.params.region?.y || 0),
          size: Math.round(t.params.size || 24),
          color: t.params.color || "#ffffff"
        }
      };
    case "Grayscale":
      return { Grayscale: baseRegion };
    case "FlipHorizontal":
      return { FlipHorizontal: baseRegion };
    case "FlipVertical":
      return { FlipVertical: baseRegion };
    case "Rotate90":
      return { Rotate90: null };
    case "Rotate180":
      return { Rotate180: null };
    case "Rotate270":
      return { Rotate270: null };
    default:
      throw new Error(`Unknown transformation type: ${t.type}`);
  }
};

export function ProofModal({ isOpen, onClose }: ProofModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proof, setProof] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { showToast } = useToast();
  const { tabs, activeTab } = useTabs();

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      showToast(`${field} copied to clipboard`);
    } catch {
      showToast("Failed to copy to clipboard");
    }
  };

  const generateProof = async () => {
    const currentTab = tabs[activeTab];
    if (!currentTab?.imageUrl) {
      setError("No image selected");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setProof(null);

      // Get raw image data
      const response = await fetch(currentTab.imageUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const imageData = Array.from(uint8Array);

      // Map transformations to backend format
      const mappedTransformations = currentTab.transformations
        .map(mapTransformation)
        .filter(Boolean);

      const request: ProofRequest = {
        image_data: imageData,
        id: currentTab.id,
        transformations: mappedTransformations,
      };

      console.log('Sending request with transformations:', mappedTransformations);

      const proofResponse = await fetch('http://localhost:3001/prove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: ProofResponse = await proofResponse.json();

      if (!proofResponse.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate proof');
      }

      if (data.proof) {
        setProof(data.proof);
        showToast(data.message || "Proof generated successfully");
      } else {
        throw new Error("No proof received from server");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate proof. Please try again.";
      setError(message);
      showToast("Failed to generate proof");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const currentTab = tabs[activeTab];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg p-6 w-[480px] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-6 text-white">Generate Proof</h2>

        <div className="space-y-4">
          {currentTab ? (
            <>
              <div className="space-y-2">
                <p className="text-sm text-neutral-400">Image Name</p>
                <p className="text-white">{currentTab.name}</p>
              </div>

              {currentTab.transformations?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400">Applied Transformations</p>
                  <div className="bg-neutral-800 rounded p-2 text-sm text-neutral-300">
                    {currentTab.transformations.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span>{t.type}</span>
                        {t.params && (
                          <span className="text-neutral-500">
                            {Object.entries(t.params)
                              .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                              .join(", ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {proof && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400">Generated Proof</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white break-all flex-1">{proof}</p>
                    <button
                      onClick={() => handleCopy(proof, "Proof")}
                      className="text-neutral-400 hover:text-white p-1"
                    >
                      {copiedField === "Proof" ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <button
                className={`w-full py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  isGenerating 
                    ? "bg-blue-600/50 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={generateProof}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  "Generate Proof"
                )}
              </button>
            </>
          ) : (
            <p className="text-neutral-400">No image selected</p>
          )}
        </div>
      </div>
    </div>
  );
} 