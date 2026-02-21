import React, { useMemo } from "react";
import { Bullseye, Title, Badge } from "@patternfly/react-core";
import { useNavigate } from "react-router-dom";
import EditableTable from "@/shared/components/common-legacy/table/editableTable";
import SearchInput from "@/shared/components/common-legacy/input/SearchInput";
import AlertesBadge from "@/shared/components/gestion/AlertesBadge";
import KebabMenu from "@/shared/components/common-legacy/menu/KebabMenu";
import { EnvelopeIcon } from "@patternfly/react-icons";
import type { UserData } from "@clubmanager/types";
import { useDebounce, useLocalStorage } from "@/shared/hooks/utils";
import { SkeletonTable } from "@/shared/components/ui";

export interface OngletTableauUtilisateursProps {
  utilisateurs: UserData[];
  columns: { key: string; label: string; ariaLabel: string }[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  onDeleteUser?: (user: UserData) => void;
  onEdit: (user: UserData) => void;
  onSendMessage: (user: UserData) => void;
  getUserAlertes: (userId: number) => any[];
  getSuggestedMessages: (userId: number) => any[];
}

const OngletTableauUtilisateurs: React.FC<OngletTableauUtilisateursProps> = ({
  utilisateurs,
  columns: propColumns,
  searchTerm,
  onSearchChange,
  isLoading,
  onDeleteUser,
  onEdit,
  onSendMessage,
  getUserAlertes,
  getSuggestedMessages,
}) => {
  const navigate = useNavigate();

  // Persister le terme de recherche dans localStorage
  const [savedSearchTerm, setSavedSearchTerm] = useLocalStorage("users-search-term", "");

  // Sync searchTerm avec localStorage
  React.useEffect(() => {
    if (searchTerm !== savedSearchTerm) {
      setSavedSearchTerm(searchTerm);
    }
  }, [searchTerm, savedSearchTerm, setSavedSearchTerm]);

  // Debounce le terme de recherche pour optimiser les performances
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtre les utilisateurs selon le terme de recherche debounced
  const filteredUtilisateurs = useMemo(() => {
    return utilisateurs.filter((u) => {
      if (!u) return false;

      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        (u.nom_utilisateur && u.nom_utilisateur.toString().toLowerCase().includes(searchLower)) ||
        (u.email && u.email.toString().toLowerCase().includes(searchLower)) ||
        (u.first_name && u.first_name.toString().toLowerCase().includes(searchLower)) ||
        (u.last_name && u.last_name.toString().toLowerCase().includes(searchLower)) ||
        (u.status && u.status.toString().toLowerCase().includes(searchLower))
      );
    });
  }, [utilisateurs, debouncedSearchTerm]);

  // Vérification de sécurité pour éviter les erreurs
  if (isLoading) {
    return (
      <div className="pf-v5-u-p-lg">
        <div className="pf-v5-u-mb-md">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Rechercher un utilisateur..."
          />
        </div>
        <SkeletonTable rows={8} columns={propColumns.length} />
      </div>
    );
  }

  if (!utilisateurs || utilisateurs.length === 0) {
    return (
      <Bullseye>
        <Title headingLevel="h4">Aucun utilisateur trouvé</Title>
      </Bullseye>
    );
  }

  // Fonction pour formater les valeurs d'affichage
  const formatDisplayValue = (user: UserData, key: string) => {
    const value = user[key as keyof UserData];

    if (value === null || value === undefined || value === "") {
      return "Non renseigné";
    }

    // Formatage spécial pour certains champs
    switch (key) {
      case "status_id":
        const statusNames = {
          1: "Visiteur",
          2: "Utilisateur",
          3: "Administrateur",
          4: "Super-administrateur",
          5: "Professeur",
        };
        return statusNames[value as keyof typeof statusNames] || `Statut ${value}`;
      default:
        return String(value);
    }
  };

  const getKebabMenuItems = (user: UserData) => {
    const alertes = getUserAlertes(user.id);
    const suggestedMessages = getSuggestedMessages(user.id);

    const menuItems = [
      {
        title: (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <EnvelopeIcon />
            Envoyer un message
            {suggestedMessages.length > 0 && (
              <Badge variant="warning" style={{ fontSize: "0.75rem" }}>
                {suggestedMessages.length}
              </Badge>
            )}
          </div>
        ),
        onClick: () => onSendMessage(user),
      },
      { title: "Modifier", onClick: () => onEdit(user) },
      {
        title: <span style={{ color: "var(--pf-global--danger-color--100)" }}>Supprimer</span>,
        onClick: () => onDeleteUser && onDeleteUser(user),
        isDanger: true,
      },
    ];

    return menuItems;
  };

  // Fonction pour gérer le clic sur une ligne
  const handleRowClick = (user: UserData) => {
    // Rediriger vers le profil de l'utilisateur avec la bonne URL
    navigate(`/pages/utilisateurs/consulter/${user.id}`);
  };

  // Configuration des colonnes simplifiée - avec le kebab menu fonctionnel
  const tableColumns = [
    {
      key: "first_name",
      label: "Prénom",
      ariaLabel: "Prénom",
      cell: (user: UserData) => user.first_name || "Non renseigné",
    },
    {
      key: "last_name",
      label: "Nom",
      ariaLabel: "Nom",
      cell: (user: UserData) => user.last_name || "Non renseigné",
    },
    {
      key: "email",
      label: "Email",
      ariaLabel: "Email",
      cell: (user: UserData) => user.email || "Non renseigné",
    },
    {
      key: "status_id",
      label: "Statut",
      ariaLabel: "Statut",
      cell: (user: UserData) => formatDisplayValue(user, "status_id"),
    },
    {
      key: "alertes",
      label: "Alertes",
      ariaLabel: "Alertes",
      cell: (user: UserData) => {
        const alertes = getUserAlertes(user.id);
        return alertes.length > 0 ? (
          <AlertesBadge alertes={alertes} />
        ) : (
          <span style={{ color: "#6a6e73", fontSize: "0.875rem" }}>Aucune</span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      ariaLabel: "Actions",
      cell: (user: UserData) => <KebabMenu items={getKebabMenuItems(user)} />,
    },
  ];

  console.log("Utilisateurs data:", utilisateurs.slice(0, 2)); // Debug pour voir les données

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Rechercher par nom, prénom, email ou statut..."
        />
        <div
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            color: "#6a6e73",
            fontStyle: "italic",
          }}
        >
          💡 Cliquez sur une ligne pour voir le profil utilisateur
        </div>
      </div>

      <EditableTable
        data={filteredUtilisateurs}
        columns={tableColumns}
        isLoading={isLoading}
        emptyStateMessage="Aucun utilisateur trouvé"
        onRowClick={handleRowClick}
      />
    </div>
  );
};

export default OngletTableauUtilisateurs;
