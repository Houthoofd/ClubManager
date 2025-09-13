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

interface FormulaireCompteProps {
  compteInfo: any;
  form: {
    email: string;
    date_naissance: string;
    genres: string;
    grades: string;
    abonnement: string;
    status: string;
  };
  password: string;
  showPasswordField: boolean;
  editingFields: { [key: string]: boolean };
  abonnements: any[];
  grades: any[];
  status: any[];
  genres: any[];
  onEditClick: (field: string) => void;
  onEmailChange: (value: string) => void;
  onFormChange: (field: string, value: string) => void;
  onPasswordChange: (value: string) => void;
  onApplyChanges: () => void;
  isLoading: boolean;
  formatDateForInput: (date: string) => string;
}

const FormulaireCompte: React.FC<FormulaireCompteProps> = ({
  compteInfo,
  form,
  password,
  showPasswordField,
  editingFields,
  abonnements,
  grades,
  status,
  genres,
  onEditClick,
  onEmailChange,
  onFormChange,
  onPasswordChange,
  onApplyChanges,
  isLoading,
  formatDateForInput,
}) => {
  return (
    <>
      {/* Section informations de base */}
      <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <Title headingLevel="h3" style={{ marginBottom: '1.5rem', color: '#333' }}>
          Informations personnelles
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
                    <FormGroup label="Nom" fieldId="nom">
                      <TextInput
                        type="text"
                        id="nom"
                        value={compteInfo?.utilisateur?.first_name || ''}
                        isDisabled={true}
                        style={{ backgroundColor: '#f8f9fa' }}
                      />
                    </FormGroup>
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <FormGroup label="Prénom" fieldId="prenom">
                      <TextInput
                        type="text"
                        id="prenom"
                        value={compteInfo?.utilisateur?.prenom || ''}
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
                <FormGroup label="Email" fieldId="email">
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    background: editingFields['email'] ? '#fff' : '#f8f9fa',
                    border: `1px solid ${editingFields['email'] ? '#007bff' : '#ced4da'}`,
                    borderRadius: '4px',
                    padding: '0.5rem',
                    transition: 'all 0.2s'
                  }}>
                    <TextInput
                      type="email"
                      id="email"
                      value={form.email || compteInfo?.utilisateur?.email || ''}
                      isDisabled={!editingFields['email']}
                      onChange={onEmailChange}
                      style={{ 
                        flexGrow: 1, 
                        border: 'none',
                        background: 'transparent'
                      }}
                    />
                    <Button 
                      variant="plain" 
                      onClick={() => onEditClick('email')}
                      style={{ 
                        marginLeft: '10px',
                        color: editingFields['email'] ? '#28a745' : '#007bff'
                      }}
                    >
                      {editingFields['email'] ? <CheckIcon /> : <PencilAltIcon />}
                    </Button>
                  </div>
                </FormGroup>

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
                      value={formatDateForInput(form.date_naissance || compteInfo?.utilisateur?.date_naissance)}
                      onChange={(value) => onFormChange('date_naissance', value)}
                      isDisabled={!editingFields['date_naissance']}
                      style={{ 
                        flexGrow: 1, 
                        border: 'none',
                        background: 'transparent'
                      }}
                    />
                    <Button 
                      variant="plain" 
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

                <FormGroup label="Mot de passe" fieldId="password">
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    background: '#f8f9fa',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    padding: '0.5rem'
                  }}>
                    {showPasswordField ? (
                      <TextInput
                        type="password"
                        id="password"
                        value={password}
                        onChange={onPasswordChange}
                        placeholder="Créer un mot de passe"
                        style={{ 
                          flexGrow: 1, 
                          border: 'none',
                          background: 'transparent'
                        }}
                      />
                    ) : (
                      <TextInput
                        type="password"
                        value="********"
                        isDisabled
                        style={{ 
                          flexGrow: 1, 
                          border: 'none',
                          background: 'transparent'
                        }}
                      />
                    )}
                  </div>
                </FormGroup>
              </div>
            </FlexItem>

            {/* Section informations club - modifiable */}
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
                    <FormGroup label="Genre" fieldId="genres">
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
                          id="genres"
                          value={form.genres || compteInfo?.utilisateur?.genres || ''}
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
                          {genres?.map((g: { id: number; genre_name: string }) => (
                            <option key={g.id} value={g.genre_name}>{g.genre_name}</option>
                          ))}
                        </select>
                        <Button
                          variant="plain"
                          onClick={() => onEditClick('genres')}
                          style={{ 
                            marginLeft: '10px',
                            color: editingFields['genres'] ? '#28a745' : '#007bff'
                          }}
                        >
                          {editingFields['genres'] ? <CheckIcon /> : <PencilAltIcon />}
                        </Button>
                      </div>
                    </FormGroup>
                  </FlexItem>

                  <FlexItem>
                    <FormGroup label="Grade" fieldId="grades">
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
                          id="grades"
                          value={form.grades || compteInfo?.utilisateur?.grades || ''}
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
                          {grades?.map((g: { id: number; grade_id: string }) => (
                            <option key={g.id} value={g.grade_id}>{g.grade_id}</option>
                          ))}
                        </select>
                        <Button
                          variant="plain"
                          onClick={() => onEditClick('grades')}
                          style={{ 
                            marginLeft: '10px',
                            color: editingFields['grades'] ? '#28a745' : '#007bff'
                          }}
                        >
                          {editingFields['grades'] ? <CheckIcon /> : <PencilAltIcon />}
                        </Button>
                      </div>
                    </FormGroup>
                  </FlexItem>

                  <FlexItem>
                    <FormGroup label="Statut" fieldId="status">
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
                          value={form.status || compteInfo?.utilisateur?.status || ''}
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
                          {status?.map((s: { id: number; nom_role: string }) => (
                            <option key={s.id} value={s.nom_role}>{s.nom_role}</option>
                          ))}
                        </select>
                        <Button
                          variant="plain"
                          onClick={() => onEditClick('status')}
                          style={{ 
                            marginLeft: '10px',
                            color: editingFields['status'] ? '#28a745' : '#007bff'
                          }}
                        >
                          {editingFields['status'] ? <CheckIcon /> : <PencilAltIcon />}
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
                          value={form.abonnement || compteInfo?.utilisateur?.abonnement || ''}
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
                          {abonnements?.map((a: { id: number; nom_plan: string }) => (
                            <option key={a.id} value={a.nom_plan}>{a.nom_plan}</option>
                          ))}
                        </select>
                        <Button
                          variant="plain"
                          onClick={() => onEditClick('abonnement')}
                          style={{ 
                            marginLeft: '10px',
                            color: editingFields['abonnement'] ? '#28a745' : '#007bff'
                          }}
                        >
                          {editingFields['abonnement'] ? <CheckIcon /> : <PencilAltIcon />}
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
          onClick={onApplyChanges} 
          isDisabled={!Object.values(editingFields).some(Boolean) && !showPasswordField}
          style={{
            background: (!Object.values(editingFields).some(Boolean) && !showPasswordField) ? '#6c757d' : '#007bff',
            borderColor: (!Object.values(editingFields).some(Boolean) && !showPasswordField) ? '#6c757d' : '#007bff',
            padding: '0.75rem 2rem'
          }}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" style={{ marginRight: '0.5rem' }} />
              Enregistrement...
            </>
          ) : (
            'Voir les changements effectués'
          )}
        </Button>
      </div>
    </>
  );
};

export default FormulaireCompte;
