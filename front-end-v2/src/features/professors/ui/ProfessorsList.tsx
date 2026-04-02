/**
 * ProfessorsList Component
 *
 * Comprehensive list/grid component for displaying professors with advanced features:
 * - Grid and list view modes
 * - Real-time search with debounce
 * - Multiple filters (status, specialty, sort)
 * - Pagination with page size selector
 * - Bulk actions (select multiple, activate/deactivate)
 * - CRUD operations (edit, delete, toggle active)
 * - Loading states with skeleton loaders
 * - Empty and error states
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ProfessorCard } from './ProfessorCard';
import type { ProfessorListItem, SearchProfessorParams } from '../model/types';
import {
  useProfessors,
  useSearchProfessors,
  useDeleteProfessor,
  useToggleProfessorActive,
} from '../model/useProfessors';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ProfessorsListProps {
  onProfessorClick?: (professor: ProfessorListItem) => void;
  onEdit?: (professor: ProfessorListItem) => void;
  onDelete?: (professor: ProfessorListItem) => void;
  viewMode?: 'grid' | 'list';
  showFilters?: boolean;
  compact?: boolean;
}

type StatusFilter = 'tous' | 'actifs' | 'inactifs';
type SortField = 'nom' | 'prenom' | 'specialite' | 'nombre_cours';
type SortOrder = 'asc' | 'desc';

// ============================================================================
// Main Component
// ============================================================================

export const ProfessorsList: React.FC<ProfessorsListProps> = ({
  onProfessorClick,
  onEdit,
  onDelete,
  viewMode: initialViewMode = 'grid',
  showFilters = true,
  compact = false,
}) => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('nom');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [professorToDelete, setProfessorToDelete] = useState<ProfessorListItem | null>(null);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [professorToToggle, setProfessorToToggle] = useState<ProfessorListItem | null>(null);

  // ============================================================================
  // Debounce Search
  // ============================================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ============================================================================
  // Build Query Parameters
  // ============================================================================

  const queryParams = useMemo<SearchProfessorParams>(() => {
    const params: SearchProfessorParams = {
      page,
      limit: pageSize,
      sort: sortField,
      order: sortOrder,
    };

    // Status filter
    if (statusFilter === 'actifs') {
      params.actif = true;
    } else if (statusFilter === 'inactifs') {
      params.actif = false;
    }

    // Specialty filter
    if (specialtyFilter) {
      params.specialite = specialtyFilter;
    }

    // Search filter (if no debounced search, we use normal query)
    if (debouncedSearch) {
      params.nom = debouncedSearch;
    }

    return params;
  }, [page, pageSize, sortField, sortOrder, statusFilter, specialtyFilter, debouncedSearch]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const {
    professors,
    total,
    totalPages,
    isLoading,
    isError,
    error,
    refetch,
  } = useProfessors(queryParams);

  const deleteMutation = useDeleteProfessor();
  const toggleActiveMutation = useToggleProfessorActive();

  // ============================================================================
  // Extract Unique Specialties
  // ============================================================================

  const specialties = useMemo(() => {
    const uniqueSpecialties = new Set<string>();
    professors.forEach((prof) => {
      if (prof.specialite) {
        uniqueSpecialties.add(prof.specialite);
      }
    });
    return Array.from(uniqueSpecialties).sort();
  }, [professors]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('tous');
    setSpecialtyFilter('');
    setSortField('nom');
    setSortOrder('asc');
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setSelectedIds(new Set()); // Clear selection on page change
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleSelectProfessor = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === professors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(professors.map((p) => p.id)));
    }
  }, [professors, selectedIds.size]);

  const handleDeleteClick = useCallback((professor: ProfessorListItem) => {
    setProfessorToDelete(professor);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!professorToDelete) return;

    try {
      await deleteMutation.mutateAsync(professorToDelete.id);
      setDeleteModalOpen(false);
      setProfessorToDelete(null);
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(professorToDelete.id);
        return newSet;
      });
      if (onDelete) {
        onDelete(professorToDelete);
      }
    } catch (err) {
      console.error('Failed to delete professor:', err);
    }
  }, [professorToDelete, deleteMutation, onDelete]);

  const handleToggleClick = useCallback((professor: ProfessorListItem) => {
    setProfessorToToggle(professor);
    setToggleModalOpen(true);
  }, []);

  const handleConfirmToggle = useCallback(async () => {
    if (!professorToToggle) return;

    try {
      await toggleActiveMutation.mutateAsync({
        id: professorToToggle.id,
        actif: !professorToToggle.actif,
      });
      setToggleModalOpen(false);
      setProfessorToToggle(null);
    } catch (err) {
      console.error('Failed to toggle professor status:', err);
    }
  }, [professorToToggle, toggleActiveMutation]);

  const handleBulkToggle = useCallback(async (activate: boolean) => {
    const selectedProfessors = professors.filter((p) => selectedIds.has(p.id));

    try {
      await Promise.all(
        selectedProfessors.map((prof) =>
          toggleActiveMutation.mutateAsync({ id: prof.id, actif: activate })
        )
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to bulk toggle professors:', err);
    }
  }, [professors, selectedIds, toggleActiveMutation]);

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Professeurs
          {!isLoading && (
            <span className="ml-2 text-lg font-normal text-gray-500">
              ({total})
            </span>
          )}
        </h2>
        {selectedIds.size > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {selectedIds.size} professeur{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Vue grille"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Vue liste"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nom ou prénom..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="tous">Tous</option>
              <option value="actifs">Actifs</option>
              <option value="inactifs">Inactifs</option>
            </select>
          </div>

          {/* Specialty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spécialité
            </label>
            <select
              value={specialtyFilter}
              onChange={(e) => {
                setSpecialtyFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Sort Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trier par
            </label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="nom">Nom</option>
              <option value="prenom">Prénom</option>
              <option value="specialite">Spécialité</option>
              <option value="nombre_cours">Nombre de cours</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordre
            </label>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
            >
              <span>{sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}</span>
              <svg
                className={`w-5 h-5 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Actions groupées:</span>
            <button
              onClick={() => handleBulkToggle(true)}
              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
            >
              Activer
            </button>
            <button
              onClick={() => handleBulkToggle(false)}
              className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
            >
              Désactiver
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSkeletonGrid = () => (
    <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
      {Array.from({ length: pageSize }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-16 h-16 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderSkeletonList = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded w-8" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded w-24" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded w-32" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded w-20" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-4" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <svg
        className="mx-auto h-16 w-16 text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Aucun professeur trouvé
      </h3>
      <p className="text-gray-600 mb-6">
        Commencez par ajouter votre premier professeur
      </p>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Ajouter un professeur
      </button>
    </div>
  );

  const renderNoResultsState = () => (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <svg
        className="mx-auto h-16 w-16 text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Aucun résultat
      </h3>
      <p className="text-gray-600 mb-4">
        Aucun professeur ne correspond à vos critères de recherche
      </p>
      <button
        onClick={handleClearFilters}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );

  const renderErrorState = () => (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <svg
        className="mx-auto h-16 w-16 text-red-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Erreur de chargement
      </h3>
      <p className="text-gray-600 mb-6">
        {error?.message || 'Une erreur est survenue lors du chargement des professeurs'}
      </p>
      <button
        onClick={() => refetch()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );

  const renderGridView = () => (
    <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
      {professors.map((professor) => (
        <div key={professor.id} className="relative">
          {/* Selection Checkbox */}
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={selectedIds.has(professor.id)}
              onChange={() => handleSelectProfessor(professor.id)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ProfessorCard
            professor={professor}
            onClick={onProfessorClick}
            onEdit={onEdit}
            onDelete={handleDeleteClick}
            onToggleActive={handleToggleClick}
            showActions={true}
            compact={compact}
          />
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.size === professors.length && professors.length > 0}
                  onChange={handleSelectAll}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Professeur
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Spécialité
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cours
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {professors.map((professor) => (
              <tr
                key={professor.id}
                className={`hover:bg-gray-50 transition-colors ${!professor.actif ? 'opacity-60' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(professor.id)}
                    onChange={() => handleSelectProfessor(professor.id)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {professor.photo_url ? (
                      <img
                        src={professor.photo_url}
                        alt={professor.nom_complet}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: professor.grade_couleur || '#6B7280' }}
                      >
                        {professor.prenom[0]}{professor.nom[0]}
                      </div>
                    )}
                    <div>
                      <div
                        className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                        onClick={() => onProfessorClick?.(professor)}
                      >
                        {professor.nom_complet}
                      </div>
                      {professor.grade_nom && (
                        <div className="text-xs text-gray-500">{professor.grade_nom}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div className="space-y-1">
                    {professor.email && (
                      <div className="truncate max-w-xs">{professor.email}</div>
                    )}
                    {professor.telephone && (
                      <div>{professor.telephone}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {professor.specialite || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {professor.nombre_cours}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {professor.actif ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(professor)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleClick(professor)}
                      className={`p-1.5 rounded transition-colors ${
                        professor.actif
                          ? 'hover:bg-gray-100 text-gray-600 hover:text-orange-600'
                          : 'hover:bg-gray-100 text-gray-600 hover:text-green-600'
                      }`}
                      title={professor.actif ? 'Désactiver' : 'Activer'}
                    >
                      {professor.actif ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(professor)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPagination = () => {
    if (total === 0) return null;

    const startIndex = (page - 1) * pageSize + 1;
    const endIndex = Math.min(page * pageSize, total);

    return (
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Affichage de {startIndex} à {endIndex} sur {total} professeurs
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Par page:</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={`px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
              page === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className={`px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
              page === totalPages
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Jump to Page */}
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-600">Page:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => {
                const newPage = Number(e.target.value);
                if (newPage >= 1 && newPage <= totalPages) {
                  handlePageChange(newPage);
                }
              }}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">/ {totalPages}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteModal = () => {
    if (!deleteModalOpen || !professorToDelete) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Supprimer le professeur
              </h3>
              <p className="text-gray-600">
                Êtes-vous sûr de vouloir supprimer <strong>{professorToDelete.nom_complet}</strong> ?
                Cette action ne peut pas être annulée.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setProfessorToDelete(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={deleteMutation.isPending}
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderToggleModal = () => {
    if (!toggleModalOpen || !professorToToggle) return null;

    const isActivating = !professorToToggle.actif;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isActivating ? 'bg-green-100' : 'bg-orange-100'}`}>
              <svg className={`w-6 h-6 ${isActivating ? 'text-green-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isActivating ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                )}
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isActivating ? 'Activer' : 'Désactiver'} le professeur
              </h3>
              <p className="text-gray-600">
                Êtes-vous sûr de vouloir {isActivating ? 'activer' : 'désactiver'}{' '}
                <strong>{professorToToggle.nom_complet}</strong> ?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setToggleModalOpen(false);
                setProfessorToToggle(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={toggleActiveMutation.isPending}
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmToggle}
              disabled={toggleActiveMutation.isPending}
              className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isActivating
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {toggleActiveMutation.isPending
                ? isActivating
                  ? 'Activation...'
                  : 'Désactivation...'
                : isActivating
                ? 'Activer'
                : 'Désactiver'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="professors-list">
      {renderHeader()}
      {renderFilters()}

      {/* Content */}
      {isLoading ? (
        viewMode === 'grid' ? renderSkeletonGrid() : renderSkeletonList()
      ) : isError ? (
        renderErrorState()
      ) : total === 0 && !debouncedSearch && statusFilter === 'tous' && !specialtyFilter ? (
        renderEmptyState()
      ) : professors.length === 0 ? (
        renderNoResultsState()
      ) : (
        <>
          {viewMode === 'grid' ? renderGridView() : renderListView()}
          {renderPagination()}
        </>
      )}

      {/* Modals */}
      {renderDeleteModal()}
      {renderToggleModal()}
    </div>
  );
};

export default ProfessorsList;
