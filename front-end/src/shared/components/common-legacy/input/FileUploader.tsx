import { useEffect, useState } from "react";
import { FileUpload, Button } from "@patternfly/react-core";
import type { DropEvent } from "@patternfly/react-core";
import { TimesIcon } from "@patternfly/react-icons";
import { apiUrl } from '@/shared/utils/apiUrl';
import { useMultipleImageUpload } from "../hooks/useUpload";

export const MultiImageUpload: React.FunctionComponent<{
  onImageUrlsChange?: (urls: string[]) => void;
  resetTrigger?: any;
  initialImages?: { name: string; url: string }[] | string[];
}> = ({ onImageUrlsChange, resetTrigger, initialImages }) => {
  const [imageList, setImageList] = useState<{ name: string; url: string }[]>(
    [],
  );
  const uploadMutation = useMultipleImageUpload();

  const handleDataChange = async (event: DropEvent, _: string) => {
    let files: FileList | null = null;

    // Vérifie si c'est un DragEvent (avec dataTransfer)
    if ("dataTransfer" in event && event.dataTransfer?.files) {
      files = event.dataTransfer.files;
    }
    // Sinon c'est probablement un ChangeEvent<HTMLInputElement>
    else if ("target" in event && (event.target as HTMLInputElement)?.files) {
      files = (event.target as HTMLInputElement).files;
    }

    if (!files || files.length === 0) return;

    try {
      const urls = await uploadMutation.mutateAsync(files);

      const newImages = Array.from(files).map((file, index) => ({
        name: file.name,
        url: urls[index],
      }));

      setImageList((prev) => {
        const updated = [...prev, ...newImages];
        onImageUrlsChange?.(updated.map((img) => img.url));
        return updated;
      });
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
    }
  };

  // Ajoute un effet pour réinitialiser le composant quand resetTrigger change
  useEffect(() => {
    if (resetTrigger !== undefined) {
      setImageList([]);
      if (onImageUrlsChange) {
        onImageUrlsChange([]);
      }
    }
  }, [resetTrigger, onImageUrlsChange]);

  // Ajoute un effet pour initialiser les images lors de l'édition
  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      // Supporte à la fois un tableau de string (urls) ou d'objets {name, url}
      const formatted =
        typeof initialImages[0] === "string"
          ? (initialImages as string[]).map((url) => ({
              name: url.split("/").pop() || "image",
              url,
            }))
          : (initialImages as { name: string; url: string }[]);
      setImageList(formatted);
      onImageUrlsChange?.(formatted.map((img) => img.url));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImages]);

  const handleClearAll = () => {
    setImageList([]);
    onImageUrlsChange?.([]);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const newList = imageList.filter((_, index) => index !== indexToRemove);
    setImageList(newList);
    onImageUrlsChange?.(newList.map((img) => img.url));
  };

  return (
    <div>
      <FileUpload
        id="multi-image-upload"
        type="dataURL"
        value=""
        filename=""
        filenamePlaceholder="Drag and drop or upload image(s)"
        onDataChange={handleDataChange}
        onReadStarted={() => {}}
        onReadFinished={() => {}}
        onClearClick={handleClearAll}
        isLoading={uploadMutation.isPending}
        allowEditingUploadedText={false}
        browseButtonText="Upload image"
      />

      {imageList.length > 0 && (
        <div
          style={{
            border: "1px solid #d2d2d2",
            padding: "1rem",
            borderRadius: "6px",
            marginTop: "1rem",
            backgroundColor: "#f0f0f0",
          }}
        >
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {imageList.map((image, index) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  width: "150px",
                  height: "150px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  overflow: "hidden",
                  backgroundColor: "#fff",
                }}
              >
                <button
                  onClick={() => handleRemoveImage(index)}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6a6e73",
                  }}
                  aria-label={`Supprimer ${image.name}`}
                >
                  <TimesIcon />
                </button>
                <img
                  src={image.url}
                  alt={image.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
          <Button
            variant="link"
            onClick={handleClearAll}
            style={{ marginTop: "1rem" }}
          >
            Tout effacer
          </Button>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;
