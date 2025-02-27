import React from 'react';

interface ModalProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  message: string;
}

const Modal: React.FC<ModalProps> = ({ showModal, setShowModal, message }) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-md shadow-lg w-1/3">
        <h2 className="text-xl font-bold mb-4">Notification</h2>
        <p>{message}</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;

