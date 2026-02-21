import React, { useState } from "react";
import {
  PageSection,
  Form,
  FormGroup,
  Switch,
  Button,
  FormSelect,
  FormSelectOption,
  Card,
  CardBody,
  Title,
  Divider,
} from "@patternfly/react-core";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import ModalWithHelp from "@/shared/components/common-legacy/modal/modalwithhelp";

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("light");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<"confirmation" | "success" | "error">("success");

  const handleSave = () => {
    console.log("Notifications activées:", notifications);
    console.log("Thème:", theme);
    setModalMessage("Vos paramètres ont été sauvegardés avec succès !");
    setModalVariant("success");
    setShowModal(true);
  };

  // Applique le thème choisi
  React.useEffect(() => {
    document.body.classList.remove("theme-light", "theme-dark", "theme-system");
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.classList.add(prefersDark ? "theme-dark" : "theme-light");
    } else {
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return (
    <div className="settings-page">
      <PageHeader
        title="Paramètres"
        subtitle="Configurez votre compte et vos préférences"
        variant="settings"
      />

      <PageSection className="settings-content">
        <div className="settings-container">
          <Card className="settings-card">
            <CardBody>
              <div className="settings-section">
                <div className="settings-section-header">
                  <Title headingLevel="h3" size="lg" className="settings-section-title">
                    Préférences générales
                  </Title>
                  <p className="settings-section-description">
                    Personnalisez votre expérience utilisateur
                  </p>
                </div>

                <Form className="settings-form">
                  <div className="settings-form-group">
                    <FormGroup
                      label="Notifications par e‑mail"
                      fieldId="notifications"
                      className="settings-form-field"
                    >
                      <div className="settings-switch-container">
                        <Switch
                          id="notifications"
                          label={notifications ? "Activées" : "Désactivées"}
                          isChecked={notifications}
                          onChange={(_e, checked) => setNotifications(checked)}
                          className="settings-switch"
                        />
                        <p className="settings-field-description">
                          Recevez des notifications par email pour les événements importants
                        </p>
                      </div>
                    </FormGroup>
                  </div>

                  <Divider className="settings-divider" />

                  <div className="settings-form-group">
                    <FormGroup
                      label="Thème d'affichage"
                      fieldId="theme-select"
                      className="settings-form-field"
                    >
                      <div className="settings-select-container">
                        <FormSelect
                          value={theme}
                          onChange={(_event, value) => setTheme(value)}
                          aria-label="Sélection du thème"
                          className="settings-select"
                        >
                          <FormSelectOption value="light" label="Clair" />
                          <FormSelectOption value="dark" label="Sombre" />
                          <FormSelectOption value="system" label="Automatique (système)" />
                        </FormSelect>
                        <p className="settings-field-description">
                          Choisissez l'apparence de l'interface utilisateur
                        </p>
                      </div>
                    </FormGroup>
                  </div>

                  <Divider className="settings-divider" />

                  <div className="settings-actions">
                    <Button variant="primary" onClick={handleSave} className="settings-save-button">
                      Sauvegarder les modifications
                    </Button>
                  </div>
                </Form>
              </div>
            </CardBody>
          </Card>
        </div>
      </PageSection>

      <ModalWithHelp
        title="Paramètres sauvegardés"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        variant={modalVariant}
        context="default" // Ajout du contexte
        successMessage="Vos paramètres ont été sauvegardés avec succès !"
        actions={[
          <Button key="close" variant="primary" onClick={() => setShowModal(false)}>
            Fermer
          </Button>,
        ]}
      />
    </div>
  );
};

export default Settings;
