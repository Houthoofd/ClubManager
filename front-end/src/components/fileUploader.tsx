import { useState } from 'react';
import { FileUpload, Button } from '@patternfly/react-core';
import type { DropEvent } from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';

export const MultiImageUpload: React.FunctionComponent<{ onImageUrlsChange?: (urls: string[]) => void }> = ({ onImageUrlsChange }) => {
  const [imageList, setImageList] = useState<{ name: string; url: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const uploadToBackend = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('files', file); // <-- ici on respecte ce que le backend attend


    try {
      const res = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log(data)
      return data.files?.[0]?.url ?? null;
    } catch (err) {
      console.error('Erreur lors de l’envoi de l’image :', err);
      return null;
    }
  };

  const handleDataChange = async (event: DropEvent, _: string) => {
    let files: FileList | null = null;

    // Vérifie si c'est un DragEvent (avec dataTransfer)
    if ('dataTransfer' in event && event.dataTransfer?.files) {
      files = event.dataTransfer.files;
    }
    // Sinon c’est probablement un ChangeEvent<HTMLInputElement>
    else if ('target' in event && (event.target as HTMLInputElement)?.files) {
      files = (event.target as HTMLInputElement).files;
    }

    if (!files || files.length === 0) return;

    setIsLoading(true);

    const urls: { name: string; url: string }[] = [];

    for (const file of Array.from(files)) {
      const url = await uploadToBackend(file);
      if (url) {
        urls.push({ name: file.name, url });
      }
    }

    setIsLoading(false);

    if (urls.length > 0) {
      setImageList(prev => {
        const updated = [...prev, ...urls];
        onImageUrlsChange?.(updated.map(img => img.url));
        return updated;
      });
    }
  };




  const handleClearAll = () => {
    setImageList([]);
    onImageUrlsChange?.([]);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const newList = imageList.filter((_, index) => index !== indexToRemove);
    setImageList(newList);
    onImageUrlsChange?.(newList.map(img => img.url));
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
        onReadStarted={() => setIsLoading(true)}
        onReadFinished={() => setIsLoading(false)}
        onClearClick={handleClearAll}
        isLoading={isLoading}
        allowEditingUploadedText={false}
        browseButtonText="Upload image"
      />

      {imageList.length > 0 && (
        <div style={{ border: '1px solid #d2d2d2', padding: '1rem', borderRadius: '6px', marginTop: '1rem', backgroundColor: '#f0f0f0' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {imageList.map((image, index) => (
              <div key={index} style={{ position: 'relative', width: '150px', height: '150px', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#fff' }}>
                <button
                  onClick={() => handleRemoveImage(index)}
                  style={{ position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#6a6e73' }}
                  aria-label={`Supprimer ${image.name}`}
                >
                  <TimesIcon />
                </button>
                <img src={image.url} alt={image.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          <Button variant="link" onClick={handleClearAll} style={{ marginTop: '1rem' }}>
            Tout effacer
          </Button>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;
