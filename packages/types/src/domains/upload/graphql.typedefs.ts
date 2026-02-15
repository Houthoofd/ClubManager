/**
 * TypeDefs GraphQL pour le module Upload
 * Définit les types, queries et mutations pour la gestion des fichiers
 */

export const uploadTypeDefs = `#graphql
  # =============================================================================
  # Types de base pour l'upload
  # =============================================================================

  """
  Informations sur un fichier uploadé
  """
  type FileInfo {
    """
    Nom du fichier (sanitizé)
    """
    filename: String!

    """
    Nom original du fichier
    """
    originalName: String!

    """
    Chemin relatif du fichier
    """
    path: String!

    """
    Taille du fichier en bytes
    """
    size: Int!

    """
    Type MIME du fichier
    """
    mimetype: String!

    """
    Extension du fichier
    """
    extension: String!

    """
    Date d'upload
    """
    uploadedAt: DateTime!

    """
    ID de l'utilisateur qui a uploadé le fichier
    """
    uploadedBy: Int
  }

  """
  Résultat d'un upload de fichier
  """
  type UploadResult {
    """
    Succès de l'opération
    """
    success: Boolean!

    """
    Message descriptif
    """
    message: String!

    """
    Informations sur le fichier uploadé (si succès)
    """
    file: FileInfo

    """
    Liste de fichiers uploadés (pour upload multiple)
    """
    files: [FileInfo!]
  }

  """
  Résultat de liste de fichiers
  """
  type ListFilesResult {
    """
    Succès de l'opération
    """
    success: Boolean!

    """
    Liste des fichiers
    """
    files: [FileInfo!]!

    """
    Nombre total de fichiers
    """
    total: Int!

    """
    Indique s'il y a plus de fichiers
    """
    hasMore: Boolean!
  }

  """
  Résultat de suppression de fichier
  """
  type DeleteFileResult {
    """
    Succès de l'opération
    """
    success: Boolean!

    """
    Message descriptif
    """
    message: String!
  }

  """
  Résultat de vérification d'existence
  """
  type FileExistsResult {
    """
    Indique si le fichier existe
    """
    exists: Boolean!

    """
    Nom du fichier vérifié
    """
    filename: String!
  }

  """
  Statistiques d'upload par extension
  """
  type FilesByExtension {
    """
    Extension du fichier
    """
    extension: String!

    """
    Nombre de fichiers avec cette extension
    """
    count: Int!
  }

  """
  Statistiques globales d'upload
  """
  type UploadStats {
    """
    Nombre total de fichiers
    """
    totalFiles: Int!

    """
    Taille totale en bytes
    """
    totalSize: Int!

    """
    Taille moyenne en bytes
    """
    averageSize: Float!

    """
    Répartition par extension
    """
    filesByExtension: [FilesByExtension!]!

    """
    Fichiers récents
    """
    recentUploads: [FileInfo!]!
  }

  """
  Espace disque disponible
  """
  type DiskSpace {
    """
    Espace total en bytes
    """
    total: Int!

    """
    Espace utilisé en bytes
    """
    used: Int!

    """
    Espace libre en bytes
    """
    free: Int!

    """
    Pourcentage utilisé
    """
    percentUsed: Float!
  }

  """
  Health check du service d'upload
  """
  type UploadHealthResult {
    """
    Statut du service
    """
    status: String!

    """
    Message descriptif
    """
    message: String!

    """
    Chemin du répertoire d'upload
    """
    uploadsDirectory: String!

    """
    Indique si le répertoire est accessible en écriture
    """
    isWritable: Boolean!

    """
    Espace disque disponible
    """
    diskSpace: DiskSpace

    """
    Timestamp du check
    """
    timestamp: DateTime!
  }

  """
  Résultat de nettoyage de fichiers anciens
  """
  type CleanupResult {
    """
    Succès de l'opération
    """
    success: Boolean!

    """
    Message descriptif
    """
    message: String!

    """
    Liste des fichiers supprimés
    """
    filesDeleted: [String!]!

    """
    Nombre de fichiers supprimés
    """
    count: Int!
  }

  # =============================================================================
  # Inputs pour les mutations et queries
  # =============================================================================

  """
  Input pour uploader un fichier (base64)
  """
  input FileUploadInput {
    """
    Nom du fichier
    """
    filename: String!

    """
    Type MIME du fichier
    """
    mimetype: String!

    """
    Encodage du fichier
    """
    encoding: String!

    """
    Contenu du fichier encodé en base64
    """
    content: String!
  }

  """
  Input pour supprimer un fichier
  """
  input DeleteFileInput {
    """
    Nom du fichier à supprimer
    """
    filename: String!
  }

  """
  Input pour lister les fichiers
  """
  input ListFilesInput {
    """
    Nombre maximum de fichiers à retourner
    """
    limit: Int

    """
    Offset pour la pagination
    """
    offset: Int

    """
    Tri par (name, size, date)
    """
    sortBy: String

    """
    Ordre de tri (asc, desc)
    """
    sortOrder: String

    """
    Filtrer par extension
    """
    extension: String
  }

  # =============================================================================
  # Queries
  # =============================================================================

  extend type Query {
    """
    Health check du service d'upload
    """
    uploadHealth: UploadHealthResult!

    """
    Liste les fichiers uploadés
    """
    listUploadedFiles(input: ListFilesInput): ListFilesResult!

    """
    Récupère les informations d'un fichier spécifique
    """
    getFileInfo(filename: String!): FileInfo!

    """
    Récupère les statistiques d'upload
    """
    uploadStats: UploadStats!

    """
    Vérifie si un fichier existe
    """
    fileExists(filename: String!): FileExistsResult!
  }

  # =============================================================================
  # Mutations
  # =============================================================================

  extend type Mutation {
    """
    Upload un fichier (base64)
    """
    uploadFile(input: FileUploadInput!): UploadResult!

    """
    Supprime un fichier
    """
    deleteFile(input: DeleteFileInput!): DeleteFileResult!

    """
    Nettoie les fichiers anciens
    """
    cleanupOldFiles(daysOld: Int): CleanupResult!
  }
`;
