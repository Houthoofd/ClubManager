import React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Button,
  Card,
  Title,
  Flex,
  FlexItem,
  Spinner,
} from '@patternfly/react-core';
import { PencilAltIcon, CheckIcon } from '@patternfly/react-icons';

interface FormulaireUtilisateurProps {
  form: {
    prenom: string;
    nom: string;
    email: string;
    date_naissance: string;
    genres: string;
    grades: string;
    abonnement: string;
    status: string; // Ajout du statut
  };
  editingFields: { [key: string]: boolean };
  emailCheckMessage: string;
  abonnements: any[];
  gradesList: any[];
  statusList: any[]; // Ajout de statusList
  genresList: any[]; // Ajout de genresList
  onEditClick: (field: string) => void;
  onEmailChange: (value: string) => void;
  onInputChange: (value: string, event: React.FormEvent<HTMLInputElement>) => void;
  onFormChange: (field: string, value: string) => void;
  onValidateChanges: () => void;
  isLoading: boolean;
  formatDateForInput: (date: string) => string;
  canEditStatus: boolean; // Ajout de canEditStatus
  disabledFields?: { [key: string]: boolean }; // Ajout de disabledFields
  emailValidation?: { // AJOUTÉ: Nouvelle prop optionnelle
    isValid: boolean;
    message: string;
    isChecking: boolean;
  };
}

const FormulaireUtilisateur: React.FC<FormulaireUtilisateurProps> = ({
  form,
  editingFields,
  emailCheckMessage,
  abonnements,
  gradesList,
  statusList,
  genresList,
  onEditClick,
  onEmailChange,
  onInputChange,
  onFormChange,
  onValidateChanges,
  isLoading,
  formatDateForInput,
  canEditStatus,
  disabledFields = {},
  emailValidation = { isValid: true, message: '', isChecking: false }, // AJOUTÉ: Valeur par défaut
}) => {
  // AJOUTÉ: Fonction pour s'assurer que les valeurs sont des strings
  const safeStringValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      console.warn('⚠️ Object value detected:', value);
      return String(value);
    }
    return String(value);
  };

  return (
    <>
      <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <Title headingLevel="h3" style={{ marginBottom: '1.5rem', color: '#333' }}>
          Informations de base
        </Title>
        <Form>
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
            {/* Section identité - non modifiable */}
            <FlexItem>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <Title headingLevel="h4" size="md" style={{ marginBottom: '1rem', color: '#495057' }}>
                  Identité (non modifiable)
                </Title>
                <Flex spaceItems={{ default: 'spaceItemsLg' }}>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <FormGroup label="Prénom" fieldId="prenom">
                      <TextInput
                        type="text"
                        id="prenom"
                        name="prenom"
                        value={form.prenom}
                        isDisabled={true}
                        style={{ backgroundColor: '#f8f9fa' }}
                      />
                    </FormGroup>
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <FormGroup label="Nom" fieldId="nom">
                      <TextInput
                        type="text"
                        id="nom"
                        name="nom"
                        value={form.nom}
                        isDisabled={true}
                        style={{ backgroundColor: '#f8f9fa' }}
                      />
                    </FormGroup>
                  </FlexItem>
                </Flex>
              </div>
            </FlexItem>

            {/* Section contact - modifiable */}
            <FlexItem>
              <div style={{ 
                background: '#fff', 
                padding: '1rem', 
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <Title headingLevel="h4" size="md" style={{ marginBottom: '1rem', color: '#495057' }}>
                  Contact
                </Title>
                <FormGroup 
                  label="Adresse email" 
                  fieldId="email"
                  validated={editingFields['email'] ? (emailValidation.isValid ? 'success' : 'error') : 'default'} // AJOUTÉ: Validation visuelle
                  helperText={editingFields['email'] && emailValidation.message ? emailValidation.message : emailCheckMessage} // MODIFIÉ: Utiliser emailValidation ou emailCheckMessage
                  helperTextInvalid={editingFields['email'] && !emailValidation.isValid ? emailValidation.message : undefined} // AJOUTÉ: Message d'erreur
                >
                  <Flex alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <TextInput
                        id="email"
                        name="email"
                        type="email"
                        value={safeStringValue(form.email)} // MODIFIÉ: Utiliser safeStringValue
                        onChange={(_event, value) => onEmailChange(String(value))} // MODIFIÉ: Conversion en string
                        isDisabled={!editingFields['email']}
                        validated={editingFields['email'] ? (emailValidation.isValid ? 'success' : 'error') : 'default'} // AJOUTÉ: Validation visuelle
                      />
                    </FlexItem>
                    {/* AJOUTÉ: Indicateur de vérification */}
                    {editingFields['email'] && emailValidation.isChecking && (
                      <FlexItem>
                        <span style={{ marginLeft: '8px', color: '#6c757d' }}>⏳</span>
                      </FlexItem>
                    )}
                    {/* AJOUTÉ: Indicateur de validation */}
                    {editingFields['email'] && !emailValidation.isChecking && (
                      <FlexItem>
                        <span style={{ 
                          marginLeft: '8px', 
                          color: emailValidation.isValid ? '#28a745' : '#dc3545' 
                        }}>
                          {emailValidation.isValid ? '✓' : '✗'}
                        </span>
                      </FlexItem>
                    )}
                    <FlexItem>
                      <Button 
                        variant="plain" 
                        onClick={() => onEditClick('email')}
                        icon={editingFields['email'] ? <CheckIcon /> : <PencilAltIcon />}
                      />
                    </FlexItem>
                  </Flex>
                </FormGroup>
              </div>
            </FlexItem>

            {/* Section informations personnelles - modifiable */}
            <FlexItem>
              <div style={{ 
                background: '#fff', 
                padding: '1rem', 
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <Title headingLevel="h4" size="md" style={{ marginBottom: '1rem', color: '#495057' }}>
                  Informations personnelles
                </Title>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                  <FlexItem>
                    <FormGroup label="Date de naissance" fieldId="date_naissance">
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        background: editingFields['date_naissance'] ? '#fff' : '#f8f9fa',
                        border: `1px solid ${editingFields['date_naissance'] ? '#007bff' : '#ced4da'}`,
                        borderRadius: '4px',
                        padding: '0.5rem',
                        transition: 'all 0.2s'
                      }}>
                        <TextInput
                          type="date"
                          id="date_naissance"
                          name="date_naissance"
                          value={formatDateForInput(form.date_naissance)}
                          onChange={value => onInputChange(value, { currentTarget: { name: 'date_naissance', value } })}
                          isDisabled={!editingFields['date_naissance']}
                          style={{ 
                            flexGrow: 1, 
                            border: 'none',
                            background: 'transparent'
                          }}
                        />
                        <Button 
                          variant="plain" 
                          aria-label={editingFields['date_naissance'] ? "Valider" : "Éditer"} 
                          onClick={() => onEditClick('date_naissance')}
                          style={{ 
                            marginLeft: '10px',
                            color: editingFields['date_naissance'] ? '#28a745' : '#007bff'
                          }}
                        >
                          {editingFields['date_naissance'] ? <CheckIcon /> : <PencilAltIcon />}
                        </Button>
                      </div>
                    </FormGroup>
                  </FlexItem>

                  <FlexItem>
                    <FormGroup label="Genre" fieldId="genre">
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        background: editingFields['genres'] ? '#fff' : '#f8f9fa',
                        border: `1px solid ${editingFields['genres'] ? '#007bff' : '#ced4da'}`,
                        borderRadius: '4px',
                        padding: '0.5rem',
                        transition: 'all 0.2s'
                      }}>
                        <select
                          id="genre"
                          name="genres"
                          value={form.genres}
                          onChange={e => onFormChange('genres', e.target.value)}
                          disabled={!editingFields['genres']}
                          style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            padding: '0.25rem',
                            fontSize: '1rem',
                            outline: 'none'
                          }}
                        >
                          <option value="">Sélectionner un genre</option>
                          <option value="Masculin">Masculin</option>
                          <option value="Féminin">Féminin</option>
                          <option value="Autre">Autre</option>
                        </select>
                        <Button
                          variant="plain"
                          onClick={() => onEditClick('genres')}
                          style={{ 
                            marginLeft: '10px',
                            color: editingFields['genres'] ? '#28a745' : '#007bff'
                          }}
                          aria-label={editingFields['genres'] ? "Valider" : "Éditer"}
                        >
                          {editingFields['genres'] ? <CheckIcon /> : <PencilAltIcon />}
                        </Button>
                      </div>
                    </FormGroup>
                  </FlexItem>
                </Flex>
              </div>
            </FlexItem>

            {/* Section club - modifiable */}
            <FlexItem>
              <div style={{ 
                background: '#fff', 
                padding: '1rem', 
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <Title headingLevel="h4" size="md" style={{ marginBottom: '1rem', color: '#495057' }}>
                  Informations club
                </Title>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                  <FlexItem>
                    <FormGroup label="Grade" fieldId="grade">
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        background: editingFields['grades'] ? '#fff' : '#f8f9fa',
                        border: `1px solid ${editingFields['grades'] ? '#007bff' : '#ced4da'}`,
                        borderRadius: '4px',
                        padding: '0.5rem',
                        transition: 'all 0.2s'
                      }}>
                        <select
                          id="grade"
                          name="grades"
                          value={form.grades}
                          onChange={e => onFormChange('grades', e.target.value)}
                          disabled={!editingFields['grades']}
                          style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            padding: '0.25rem',
                            fontSize: '1rem',
                            outline: 'none'
                          }}
                        >
                          <option value="">Sélectionner un grade</option>
                          {gradesList.map(grade => (
                            <option key={grade.id} value={grade.grade_id}>
                              {grade.grade_id}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="plain"
                          onClick={() => onEditClick('grades')}
                          style={{ 
                            marginLeft: '10px',
                            color: editingFields['grades'] ? '#28a745' : '#007bff'
                          }}
                          aria-label={editingFields['grades'] ? "Valider" : "Éditer"}
                        >
                          {editingFields['grades'] ? <CheckIcon /> : <PencilAltIcon />}
                        </Button>
                      </div>
                    </FormGroup>
                  </FlexItem>

                  <FlexItem>
                    <FormGroup label="Abonnement" fieldId="abonnement">
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        background: editingFields['abonnement'] ? '#fff' : '#f8f9fa',
                        border: `1px solid ${editingFields['abonnement'] ? '#007bff' : '#ced4da'}`,
                        borderRadius: '4px',
                        padding: '0.5rem',
                        transition: 'all 0.2s'
                      }}>
                        <select
                          id="abonnement"
                          name="abonnement"
                          value={form.abonnement}
                          onChange={e => onFormChange('abonnement', e.target.value)}
                          disabled={!editingFields['abonnement']}
                          style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            padding: '0.25rem',
                            fontSize: '1rem',
                            outline: 'none'
                          }}
                        >
                          <option value="">Sélectionner un abonnement</option>
                          {abonnements.map(ab => (
                            <option key={ab.id} value={ab.nom_plan}>
                              {ab.nom_plan} ({ab.prix}€/{ab.periode})
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="plain"
                          onClick={() => onEditClick('abonnement')}
                          style={{ 
                            marginLeft: '10px',
                            color: editingFields['abonnement'] ? '#28a745' : '#007bff'
                          }}
                          aria-label={editingFields['abonnement'] ? "Valider" : "Éditer"}
                        >
                          {editingFields['abonnement'] ? <CheckIcon /> : <PencilAltIcon />}
                        </Button>
                      </div>
                    </FormGroup>
                    <FormGroup label="status" fieldId="status">
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        background: editingFields['status'] ? '#fff' : '#f8f9fa',
                        border: `1px solid ${editingFields['status'] ? '#007bff' : '#ced4da'}`,
                        borderRadius: '4px',
                        padding: '0.5rem',
                        transition: 'all 0.2s'
                      }}>
                        <select
                          id="status"
                          name="status"
                          value={form.status}
                          onChange={e => onFormChange('status', e.target.value)}
                          disabled={!editingFields['status']}
                          style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            padding: '0.25rem',
                            fontSize: '1rem',
                            outline: 'none'
                          }}
                        >
                          <option value="">Sélectionner un statut</option>
                          {statusList.map(status => (
                            <option key={status.id} value={status.nom_role}>
                              {status.nom_role}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="plain"
                          onClick={() => onEditClick('status')}
                          style={{ 
                            marginLeft: '10px',
                            color: editingFields['status'] ? '#28a745' : '#007bff'
                          }}
                          aria-label={editingFields['status'] ? "Valider" : "Éditer"}
                        >
                          {editingFields['status'] ? <CheckIcon /> : <PencilAltIcon />}
                        </Button>
                      </div>
                    </FormGroup>
                  </FlexItem>
                </Flex>
              </div>
            </FlexItem>
          </Flex>
        </Form>
      </Card>
      
      {/* Bouton d'enregistrement */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        {Object.values(editingFields).some(Boolean) && (
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#6c757d',
            fontStyle: 'italic'
          }}>
            {Object.values(editingFields).filter(Boolean).length} modification{Object.values(editingFields).filter(Boolean).length > 1 ? 's' : ''} en cours
          </div>
        )}
        <Button 
          variant="primary" 
          size="lg"
          onClick={onValidateChanges} 
          isDisabled={!Object.values(editingFields).some(Boolean) || isLoading}
          style={{
            background: !Object.values(editingFields).some(Boolean) ? '#6c757d' : '#007bff',
            borderColor: !Object.values(editingFields).some(Boolean) ? '#6c757d' : '#007bff',
            padding: '0.75rem 2rem'
          }}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" style={{ marginRight: '0.5rem' }} />
              Enregistrement...
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </Button>
      </div>
    </>
  );
};

export default FormulaireUtilisateur;
