import React, { useState, useEffect } from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Button,
  Card,
  Title,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { PencilAltIcon, CheckIcon } from '@patternfly/react-icons';
import { useCheckEmail } from '../../hooks/useVerification';

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
  disabledFields?: { [key: string]: boolean };
  includePassword?: boolean;
  canEditStatus?: boolean;
  currentUserId?: number; // AJOUTÉ: Pour exclure l'utilisateur actuel de la vérification
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
  disabledFields = {},
  includePassword = false,
}) => {
  
  // AJOUTÉ: Hook pour vérifier l'email
  const checkEmail = useCheckEmail();
  
  // AJOUTÉ: États pour la validation email
  const [emailValidation, setEmailValidation] = useState({
    isValid: true,
    message: '',
    isChecking: false
  });

  // AJOUTÉ: Fonction de validation du format email
  const isValidEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // MODIFIÉ: Handler pour la validation de l'email avec meilleur debugging
  const handleEmailValidation = async (email: string) => {
    console.log('🔍 handleEmailValidation: Début validation pour:', email);
    setEmailValidation({ isValid: true, message: '', isChecking: true });
    
    // Vérification du format
    if (!email.trim()) {
      console.log('❌ handleEmailValidation: Email vide');
      setEmailValidation({ isValid: false, message: 'L\'email est requis', isChecking: false });
      return false;
    }
    
    if (!isValidEmailFormat(email)) {
      console.log('❌ handleEmailValidation: Format invalide');
      setEmailValidation({ isValid: false, message: 'Format d\'email invalide', isChecking: false });
      return false;
    }
    
    // Vérification de l'unicité avec le hook
    try {
      console.log('🔍 handleEmailValidation: Vérification unicité...');
      const emailExists = await checkEmail(email);
      
      // Si l'email existe ET que ce n'est pas le même que l'email actuel
      const currentEmail = compteInfo?.utilisateur?.email;
      console.log('📧 handleEmailValidation: Email actuel:', currentEmail, '| Email saisi:', email, '| Existe:', emailExists);
      
      if (emailExists && email !== currentEmail) {
        console.log('❌ handleEmailValidation: Email déjà utilisé');
        setEmailValidation({ 
          isValid: false, 
          message: 'Cette adresse email est déjà utilisée par un autre utilisateur', 
          isChecking: false 
        });
        return false;
      }
      
      console.log('✅ handleEmailValidation: Email valide');
      setEmailValidation({ isValid: true, message: 'Email valide', isChecking: false });
      return true;
    } catch (error) {
      console.error('❌ handleEmailValidation: Erreur:', error);
      setEmailValidation({ 
        isValid: false, 
        message: 'Erreur lors de la vérification de l\'email', 
        isChecking: false 
      });
      return false;
    }
  };

  // AJOUTÉ: Handler modifié pour l'email avec validation
  const handleEmailChangeWithValidation = async (value: string) => {
    onEmailChange(value);
    
    // Délai pour éviter trop de requêtes
    if (editingFields['email']) {
      setTimeout(async () => {
        const isValid = await handleEmailValidation(value);
        
        // AJOUTÉ: Si l'email est valide et différent de l'original, on peut préparer la mise à jour
        if (isValid && value !== compteInfo?.utilisateur?.email) {
          console.log('📧 Email valide et différent, prêt pour la sauvegarde');
        }
      }, 500);
    }
  };

  // AJOUTÉ: Fonction pour s'assurer que les valeurs sont des strings
  const safeStringValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      return String(value);
    }
    return String(value);
  };

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
                    <FormGroup label="Prénom" fieldId="prenom">
                      <TextInput
                        type="text"
                        id="prenom"
                        value={compteInfo?.utilisateur?.first_name || ''}
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
                        value={compteInfo?.utilisateur?.last_name || ''}
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
                  label="Email" 
                  fieldId="email"
                  validated={editingFields['email'] ? (emailValidation.isValid ? 'success' : 'error') : 'default'}
                  helperText={editingFields['email'] && emailValidation.message ? emailValidation.message : undefined}
                  helperTextInvalid={editingFields['email'] && !emailValidation.isValid ? emailValidation.message : undefined}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    background: editingFields['email'] ? '#fff' : '#f8f9fa',
                    border: `1px solid ${
                      editingFields['email'] 
                        ? emailValidation.isValid 
                          ? '#007bff' 
                          : '#dc3545'
                        : '#ced4da'
                    }`,
                    borderRadius: '4px',
                    padding: '0.5rem',
                    transition: 'all 0.2s'
                  }}>
                    <TextInput
                      type="email"
                      id="email"
                      value={editingFields['email'] ? safeStringValue(form.email) : safeStringValue(compteInfo?.utilisateur?.email || '')}
                      isDisabled={!editingFields['email'] || disabledFields['email']}
                      onChange={(_event, value) => handleEmailChangeWithValidation(String(value))} // MODIFIÉ: Utiliser le handler avec validation
                      validated={editingFields['email'] ? (emailValidation.isValid ? 'success' : 'error') : 'default'}
                      style={{ 
                        flexGrow: 1, 
                        border: 'none',
                        background: 'transparent'
                      }}
                    />
                    {/* AJOUTÉ: Indicateur de vérification */}
                    {editingFields['email'] && emailValidation.isChecking && (
                      <span style={{ marginLeft: '8px', color: '#6c757d' }}>
                        ⏳
                      </span>
                    )}
                    {/* AJOUTÉ: Indicateur de validation */}
                    {editingFields['email'] && !emailValidation.isChecking && (
                      <span style={{ 
                        marginLeft: '8px', 
                        color: emailValidation.isValid ? '#28a745' : '#dc3545' 
                      }}>
                        {emailValidation.isValid ? '✓' : '✗'}
                      </span>
                    )}
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
                      value={editingFields['date_naissance'] ? formatDateForInput(form.date_naissance) : formatDateForInput(compteInfo?.utilisateur?.date_of_birth)} // CORRIGÉ: Même logique
                      onChange={(_event, value) => onFormChange('date_naissance', String(value))}
                      isDisabled={!editingFields['date_naissance'] || disabledFields['date_naissance']}
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
                    justifyContent: 'space-between',
                    background: editingFields['password'] ? '#fff' : '#f8f9fa',
                    border: `1px solid ${editingFields['password'] ? '#007bff' : '#ced4da'}`,
                    borderRadius: '4px',
                    padding: '0.5rem',
                    transition: 'all 0.2s',
                    width: '100%'
                  }}>
                    {editingFields['password'] ? (
                      <TextInput
                        id="password"
                        type="password"
                        value={safeStringValue(password)} // CORRIGÉ: Utiliser safeStringValue
                        onChange={(_event, value) => onPasswordChange(String(value))} // CORRIGÉ: Conversion en string
                        placeholder="Entrez votre nouveau mot de passe"
                        style={{
                          flex: 1,
                          border: 'none',
                          background: 'transparent',
                          padding: '0.25rem',
                          fontSize: '1rem',
                          outline: 'none',
                          marginRight: '10px'
                        }}
                      />
                    ) : (
                      <span style={{
                        flex: 1,
                        padding: '0.25rem',
                        fontSize: '1rem',
                        color: '#6c757d'
                      }}>
                        ••••••••
                      </span>
                    )}
                    <Button
                      variant="plain"
                      onClick={() => onEditClick('password')}
                      style={{ 
                        marginLeft: 'auto',
                        color: editingFields['password'] ? '#28a745' : '#007bff',
                        flexShrink: 0
                      }}
                    >
                      {editingFields['password'] ? <CheckIcon /> : <PencilAltIcon />}
                    </Button>
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
                          value={editingFields['genres'] ? safeStringValue(form.genres) : safeStringValue(compteInfo?.utilisateur?.genres || '')} // CORRIGÉ: Même logique
                          onChange={e => onFormChange('genres', e.target.value)}
                          disabled={disabledFields['genres'] ? true : !editingFields['genres']}
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
                          value={editingFields['grades'] ? safeStringValue(form.grades) : safeStringValue(compteInfo?.utilisateur?.grades || '')} // CORRIGÉ: Même logique
                          onChange={e => onFormChange('grades', e.target.value)}
                          disabled={disabledFields['grades'] ? true : !editingFields['grades']}
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
                          value={editingFields['status'] ? safeStringValue(form.status) : safeStringValue(compteInfo?.utilisateur?.status || '')} // CORRIGÉ: Même logique
                          onChange={e => onFormChange('status', e.target.value)}
                          disabled={disabledFields['status'] ? true : !editingFields['status']}
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
                          value={editingFields['abonnement'] ? safeStringValue(form.abonnement) : safeStringValue(compteInfo?.utilisateur?.abonnement || '')} // CORRIGÉ: Même logique
                          onChange={e => onFormChange('abonnement', e.target.value)}
                          disabled={disabledFields['abonnement'] ? true : !editingFields['abonnement']}
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
    </>
  );
};

export default FormulaireCompte;

