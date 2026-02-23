import { useState } from "react";
import { apiUrl } from "@/shared/utils/apiUrl";

interface UploadResponse {
  files: {
    url: string;
    name: string;
  }[];
}

interface UploadState {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
  data: UploadResponse | null;
}

interface UploadHookResult extends UploadState {
  mutateAsync: (files: FileList | File[]) => Promise<UploadResponse>;
  reset: () => void;
}

// Hook pour uploader des fichiers
export const useFileUpload = (): UploadHookResult => {
  const [state, setState] = useState<UploadState>({
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
  });

  const mutateAsync = async (files: FileList | File[]): Promise<UploadResponse> => {
    setState({
      isLoading: true,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    });

    try {
      const formData = new FormData();

      // Convertir FileList en Array si nécessaire
      const fileArray = Array.from(files);

      // Ajouter chaque fichier au FormData
      fileArray.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(apiUrl("upload"), {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload des fichiers");
      }

      const data = await response.json();

      setState({
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
        data,
      });

      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Erreur inconnue");

      setState({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: err,
        data: null,
      });

      throw err;
    }
  };

  const reset = () => {
    setState({
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    });
  };

  return {
    ...state,
    mutateAsync,
    reset,
  };
};

// Hook pour uploader une seule image
export const useImageUpload = () => {
  const fileUpload = useFileUpload();

  return {
    ...fileUpload,
    mutateAsync: async (file: File): Promise<string> => {
      const result = await fileUpload.mutateAsync([file]);
      return result.files[0]?.url || "";
    },
  };
};

// Hook pour uploader plusieurs images
export const useMultipleImageUpload = () => {
  const fileUpload = useFileUpload();

  return {
    ...fileUpload,
    mutateAsync: async (files: FileList | File[]): Promise<string[]> => {
      const result = await fileUpload.mutateAsync(files);
      return result.files.map((file) => file.url);
    },
  };
};
