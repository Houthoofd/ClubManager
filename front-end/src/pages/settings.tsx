import { useState } from 'react';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Form,
  FormGroup,
  Switch,
  Divider,
  Button,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@patternfly/react-core';

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Ajoute une fonction pour sauvegarder et afficher une modal
  const handleSave = () => {
    console.log('Notifications activées:', notifications);
    console.log('Thème:', theme);
    setModalMessage('Paramètres sauvegardés !');
    setShowModal(true);
  };

  // Ajoute un effet pour appliquer le thème choisi
  React.useEffect(() => {
    // Ici, on change la classe sur le body selon le thème
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-system');
    if (theme === 'system') {
      // Utilise le thème du système (dark ou light)
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Paramètres du compte
        </Title>
      </PageSection>

      <PageSection variant={PageSectionVariants.default}>
        <Form isWidthLimited maxWidth="600px">
          {/* Notifications */}
          <FormGroup label="Notifications par e‑mail" fieldId="notifications">
            <Switch
              id="notifications"
              label={notifications ? 'Activées' : 'Désactivées'}
              isChecked={notifications}
              onChange={(_e, checked) => setNotifications(checked)}
            />
          </FormGroup>

          {/* Thème */}
          <FormGroup label="Thème" fieldId="theme-select">
            <FormSelect
              value={theme}
              onChange={(_event, value) => setTheme(value)}
              aria-label="Sélection du thème"
            >
              <FormSelectOption value="light" label="Clair" />
              <FormSelectOption value="dark" label="Sombre" />
              <FormSelectOption value="system" label="Automatique (système)" />
            </FormSelect>
          </FormGroup>

          <Divider className="my-4" />

          <Button variant="primary" onClick={handleSave}>
            Sauvegarder
          </Button>
        </Form>
      </PageSection>
      {/* Modal de notification */}
      <Modal
        variant="small"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        aria-labelledby="settings-modal-title"
      >
        <ModalHeader title="Notification" />
        <ModalBody>
          {modalMessage}
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={() => setShowModal(false)}>
            OK
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default Settings;
