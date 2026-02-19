import { Modal, ModalVariant, Button, Alert, List, ListItem } from '@patternfly/react-core';

interface SendMessageConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  users: any[];
  messageType: any;
  envoyerEmail: boolean; // NOUVEAU
}

const SendMessageConfirmModal: React.FC<SendMessageConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  users,
  messageType,
  envoyerEmail // NOUVEAU
}) => {
  return (
    <Modal
      variant={ModalVariant.medium}
      title="Confirmer l'envoi du message"
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button key="confirm" variant="primary" onClick={onConfirm}>
          Envoyer le message
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Annuler
        </Button>
      ]}
    >
      <div>
        <p><strong>Type de message :</strong> {messageType?.title}</p>
        <p><strong>Nombre de destinataires :</strong> {users.length}</p>
        
        {/* NOUVEAU: Affichage du mode d'envoi */}
        <Alert 
          variant={envoyerEmail ? "info" : "warning"} 
          title={envoyerEmail ? "Envoi dual activé" : "Envoi messagerie uniquement"}
          isInline
        >
          {envoyerEmail 
            ? `Le message sera envoyé en messagerie interne ET par email à ${users.length} destinataire(s).`
            : `Le message sera envoyé uniquement en messagerie interne à ${users.length} destinataire(s).`
          }
        </Alert>

        <div style={{ marginTop: '15px' }}>
          <strong>Destinataires :</strong>
          <List>
            {users.map((user, index) => (
              <ListItem key={index}>
                {user.full_name || `${user.first_name} ${user.last_name}`}
                {envoyerEmail && <span style={{ color: '#666', fontSize: '0.9em' }}> (+ email)</span>}
              </ListItem>
            ))}
          </List>
        </div>
      </div>
    </Modal>
  );
};

export default SendMessageConfirmModal;