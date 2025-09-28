import { useMutation } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

interface UploadResponse {
  files: {
    url: string;
    name: string;
  }[];
}

// Hook pour uploader des fichiers
export const useFileUpload = () => {
  return useMutation({
    mutationFn: async (files: FileList | File[]): Promise<UploadResponse> => {
      const formData = new FormData();
      
      // Convertir FileList en Array si nécessaire
      const fileArray = Array.from(files);
      
      // Ajouter chaque fichier au FormData
      fileArray.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(apiUrl('upload'), {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload des fichiers');
      }

      return response.json();
    },
  });
};

// Hook pour uploader une seule image
export const useImageUpload = () => {
  const fileUpload = useFileUpload();
  
  return {
    ...fileUpload,
    mutateAsync: async (file: File): Promise<string> => {
      const result = await fileUpload.mutateAsync([file]);
      return result.files[0]?.url || '';
    }
  };
};

// Hook pour uploader plusieurs images
export const useMultipleImageUpload = () => {
  const fileUpload = useFileUpload();
  
  return {
    ...fileUpload,
    mutateAsync: async (files: FileList | File[]): Promise<string[]> => {
      const result = await fileUpload.mutateAsync(files);
      return result.files.map(file => file.url);
    }
  };
};
