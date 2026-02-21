import React, { useState, useEffect } from 'react';
import {
  FileUpload,
  Button,
  Gallery,
  GalleryItem,
  Card,
  CardBody,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';

interface MultiImageUploadProps {
  onImageUrlsChange: (urls: string[]) => void;
  resetTrigger?: boolean;
  initialImages?: string[];
  maxImages?: number;
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  onImageUrlsChange,
  resetTrigger = false,
  initialImages = [],
  maxImages = 10,
}) => {
  const [images, setImages] = useState<string[]>(initialImages);
  const [filename, setFilename] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (resetTrigger) {
      setImages([]);
      setFilename('');
    }
  }, [resetTrigger]);

  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setImages(initialImages);
    }
  }, [initialImages]);

  const handleFileInputChange = async (
    _event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>,
    file: File
  ) => {
    setIsLoading(true);
    setFilename(file.name);

    try {
      // Convert file to base64 URL for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const updatedImages = [...images, result];
        setImages(updatedImages);
        onImageUrlsChange(updatedImages);
        setFilename('');
        setIsLoading(false);
      };
      reader.onerror = () => {
        console.error('Error reading file');
        setIsLoading(false);
        setFilename('');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsLoading(false);
      setFilename('');
    }
  };

  const handleClear = () => {
    setFilename('');
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImageUrlsChange(updatedImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div>
      {canAddMore && (
        <FileUpload
          id="multi-image-upload"
          value={filename}
          filename={filename}
          filenamePlaceholder="Glissez une image ou cliquez pour parcourir"
          onFileInputChange={handleFileInputChange}
          onClearClick={handleClear}
          browseButtonText="Parcourir"
          clearButtonText="Effacer"
          isLoading={isLoading}
          dropzoneProps={{
            accept: {
              'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            },
          }}
          validated={images.length > 0 ? 'success' : 'default'}
        />
      )}

      {images.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <Gallery hasGutter minWidths={{ default: '150px' }}>
            {images.map((imageUrl, index) => (
              <GalleryItem key={index}>
                <Card isCompact>
                  <CardBody style={{ padding: '0.5rem', position: 'relative' }}>
                    <img
                      src={imageUrl}
                      alt={`Upload ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                    <Button
                      variant="danger"
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        minWidth: '32px',
                        height: '32px',
                        padding: '0.25rem',
                        borderRadius: '50%',
                      }}
                      icon={<TimesIcon />}
                      aria-label={`Supprimer l'image ${index + 1}`}
                    />
                  </CardBody>
                </Card>
              </GalleryItem>
            ))}
          </Gallery>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6c757d' }}>
            {images.length} / {maxImages} image(s) téléchargée(s)
          </p>
        </div>
      )}

      {!canAddMore && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#dc3545' }}>
          Nombre maximum d'images atteint ({maxImages})
        </p>
      )}
    </div>
  );
};

export default MultiImageUpload;
