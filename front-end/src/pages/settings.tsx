import React, { useState } from 'react';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Form,
  FormGroup,
  TextInput,
  Switch,
  Divider,
  Button,
  FormSelect,
  FormSelectOption
} from '@patternfly/react-core';

const Settings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');

  const handleSave = () => {
    console.log('Mot de passe:', newPassword);
    console.log('Notifications activées:', notifications);
    console.log('Thème:', theme);
    alert('Paramètres sauvegardés !');
  };

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Paramètres du compte
        </Title>
      </PageSection>

      <PageSection variant={PageSectionVariants.default}>
        <Form isWidthLimited maxWidth="600px">
          {/* Mot de passe */}
          <FormGroup label="Mot de passe actuel" fieldId="current-password">
            <TextInput
              isRequired
              type="password"
              id="current-password"
              name="current-password"
              value={currentPassword}
              onChange={(_event, value) => setCurrentPassword(value)}
            />
          </FormGroup>
          <FormGroup label="Nouveau mot de passe" fieldId="new-password">
            <TextInput
              isRequired
              type="password"
              id="new-password"
              name="new-password"
              value={newPassword}
              onChange={(_event, value) => setNewPassword(value)}
            />
          </FormGroup>

          <Divider className="my-4" />

          {/* Notifications */}
          <FormGroup label="Notifications par e-mail" fieldId="notifications">
            <Switch
              id="notifications"
              label="Activées"
              labelOff="Désactivées"
              isChecked={notifications}
              onChange={setNotifications}
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
    </>
  );
};

export default Settings;
