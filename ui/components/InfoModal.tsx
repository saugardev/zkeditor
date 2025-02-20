import { X } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageInfo: {
    name: string;
    dimensions: {
      width: number;
      height: number;
    };
    ipfsCid?: string;
    signature?: string;
  } | null;
}

export function InfoModal({ isOpen, onClose, imageInfo }: InfoModalProps) {
  if (!isOpen || !imageInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg p-6 w-[480px] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-6 text-white">
          Image Information
        </h2>

        <div className="space-y-4">
          <div className="bg-neutral-800 rounded p-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400 mb-1">Name</p>
                <p className="text-white">{imageInfo.name}</p>
              </div>

              <div>
                <p className="text-sm text-neutral-400 mb-1">Dimensions</p>
                <p className="text-white">
                  {imageInfo.dimensions.width} × {imageInfo.dimensions.height}{" "}
                  pixels
                </p>
              </div>

              {imageInfo.ipfsCid && (
                <div>
                  <p className="text-sm text-neutral-400 mb-1">IPFS CID</p>
                  <p className="text-sm font-mono break-all text-white">
                    {imageInfo.ipfsCid}
                  </p>
                </div>
              )}

              {imageInfo.signature && (
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Signature</p>
                  <p className="text-sm font-mono break-all text-white">
                    {imageInfo.signature}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
