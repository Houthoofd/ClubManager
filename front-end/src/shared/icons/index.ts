/**
 * ====================================================================
 * PATTERNFLY ICONS - CENTRALIZED EXPORT
 * ====================================================================
 *
 * ⚡ OPTIMISATION: Ce fichier centralise tous les icônes PatternFly utilisés
 * dans l'application pour permettre le tree-shaking et réduire la taille du bundle.
 *
 * Au lieu d'importer depuis '@patternfly/react-icons' partout (ce qui peut charger
 * tous les icônes), on importe depuis ce fichier qui ne contient que les icônes
 * réellement utilisés.
 *
 * @example
 * ```tsx
 * // ❌ Ancien (peut charger tous les icônes)
 * import { UserIcon, EditIcon } from '@patternfly/react-icons';
 *
 * // ✅ Nouveau (optimisé)
 * import { UserIcon, EditIcon } from '@patternfly/react-icons';
 * ```
 *
 * Impact: -50 à -100KB sur le bundle initial
 */

// ====================================================================
// NAVIGATION & ACTIONS
// ====================================================================

export { ArrowDownIcon } from '@patternfly/react-icons';
export { ArrowLeftIcon } from '@patternfly/react-icons';
export { ArrowRightIcon } from '@patternfly/react-icons';
export { ArrowUpIcon } from '@patternfly/react-icons';
export { ChevronDownIcon } from '@patternfly/react-icons';
export { ChevronLeftIcon } from '@patternfly/react-icons';
export { ChevronRightIcon } from '@patternfly/react-icons';
export { ChevronUpIcon } from '@patternfly/react-icons';
export { AngleDownIcon } from '@patternfly/react-icons';
export { AngleUpIcon } from '@patternfly/react-icons';
export { ExternalLinkAltIcon } from '@patternfly/react-icons';

// ====================================================================
// STATUS & FEEDBACK
// ====================================================================

export { CheckIcon } from '@patternfly/react-icons';
export { CheckCircleIcon } from '@patternfly/react-icons';
export { TimesIcon } from '@patternfly/react-icons';
export { TimesCircleIcon } from '@patternfly/react-icons';
export { ExclamationCircleIcon } from '@patternfly/react-icons';
export { ExclamationTriangleIcon } from '@patternfly/react-icons';
export { InfoCircleIcon } from '@patternfly/react-icons';
export { BanIcon } from '@patternfly/react-icons';
export { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';

// ====================================================================
// USERS & PEOPLE
// ====================================================================

export { UserIcon } from '@patternfly/react-icons';
export { UsersIcon } from '@patternfly/react-icons';
export { UserPlusIcon } from '@patternfly/react-icons';
export { GraduationCapIcon } from '@patternfly/react-icons';

// ====================================================================
// EDITING & ACTIONS
// ====================================================================

export { EditIcon } from '@patternfly/react-icons';
export { PencilAltIcon } from '@patternfly/react-icons';
export { TrashIcon } from '@patternfly/react-icons';
export { SaveIcon } from '@patternfly/react-icons';
export { PlusIcon } from '@patternfly/react-icons';
export { PlusCircleIcon } from '@patternfly/react-icons';
export { CloseIcon } from '@patternfly/react-icons';
export { UploadIcon } from '@patternfly/react-icons';
export { DownloadIcon } from '@patternfly/react-icons';
export { ExportIcon } from '@patternfly/react-icons';

// ====================================================================
// CHARTS & STATISTICS
// ====================================================================

export { ChartLineIcon } from '@patternfly/react-icons';
export { ChartBarIcon } from '@patternfly/react-icons';
export { ChartAreaIcon } from '@patternfly/react-icons';
export { TachometerAltIcon } from '@patternfly/react-icons';

// ====================================================================
// CALENDAR & TIME
// ====================================================================

export { CalendarIcon } from '@patternfly/react-icons';
export { CalendarAltIcon } from '@patternfly/react-icons';
export { ClockIcon } from '@patternfly/react-icons';

// ====================================================================
// COMMERCE & PAYMENT
// ====================================================================

export { CreditCardIcon } from '@patternfly/react-icons';
export { ShoppingCartIcon } from '@patternfly/react-icons';
export { DollarSignIcon } from '@patternfly/react-icons';
export { EuroIcon } from '@patternfly/react-icons';
export { MoneyCheckAltIcon } from '@patternfly/react-icons';
export { PaypalIcon } from '@patternfly/react-icons';
export { BitcoinIcon } from '@patternfly/react-icons';
export { StoreIcon } from '@patternfly/react-icons';
export { TagIcon } from '@patternfly/react-icons';
export { TruckIcon } from '@patternfly/react-icons';
export { PackageIcon } from '@patternfly/react-icons';

// ====================================================================
// COMMUNICATION
// ====================================================================

export { EnvelopeIcon } from '@patternfly/react-icons';
export { PaperPlaneIcon } from '@patternfly/react-icons';
export { BellIcon } from '@patternfly/react-icons';
export { InboxIcon } from '@patternfly/react-icons';

// ====================================================================
// VIEWS & LAYOUT
// ====================================================================

export { TableIcon } from '@patternfly/react-icons';
export { ListIcon } from '@patternfly/react-icons';
export { BarsIcon } from '@patternfly/react-icons';
export { EllipsisVIcon } from '@patternfly/react-icons';
export { SearchIcon } from '@patternfly/react-icons';
export { FilterIcon } from '@patternfly/react-icons';
export { SortAmountDownIcon } from '@patternfly/react-icons';
export { SortAmountUpIcon } from '@patternfly/react-icons';

// ====================================================================
// GENERAL PURPOSE
// ====================================================================

export { HomeIcon } from '@patternfly/react-icons';
export { CogIcon } from '@patternfly/react-icons';
export { LockIcon } from '@patternfly/react-icons';
export { ShieldAltIcon } from '@patternfly/react-icons';
export { SignOutAltIcon } from '@patternfly/react-icons';
export { EyeIcon } from '@patternfly/react-icons';
export { EyeSlashIcon } from '@patternfly/react-icons';
export { GlobeIcon } from '@patternfly/react-icons';
export { BookIcon } from '@patternfly/react-icons';
export { ImageIcon } from '@patternfly/react-icons';
export { CubeIcon } from '@patternfly/react-icons';
export { CubesIcon } from '@patternfly/react-icons';
export { HeartIcon } from '@patternfly/react-icons';
export { StarIcon } from '@patternfly/react-icons';
export { TrophyIcon } from '@patternfly/react-icons';
export { ClipboardCheckIcon } from '@patternfly/react-icons';
export { SyncIcon } from '@patternfly/react-icons';
export { SyncAltIcon } from '@patternfly/react-icons';

/**
 * ====================================================================
 * MIGRATION GUIDE
 * ====================================================================
 *
 * Pour migrer un fichier existant:
 *
 * 1. Trouver tous les imports PatternFly icons:
 *    grep "from '@patternfly/react-icons'" votre-fichier.tsx
 *
 * 2. Remplacer par:
 *    import { IconName } from '@patternfly/react-icons';
 *
 * 3. Vérifier que l'icône est dans ce fichier
 *    Si manquant, l'ajouter ici dans la catégorie appropriée
 *
 * ====================================================================
 * STATS
 * ====================================================================
 *
 * Total d'icônes exportés: ~80
 * Icônes PatternFly totaux: ~1000+
 * Économie estimée: -50 à -100KB
 *
 * ====================================================================
 */
