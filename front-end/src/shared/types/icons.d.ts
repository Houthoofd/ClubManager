/**
 * Type declarations for @patternfly/react-icons
 *
 * This file provides TypeScript declarations for PatternFly React Icons.
 * PatternFly icons don't ship with official @types, so we declare the module
 * to prevent TypeScript errors.
 */

declare module '@patternfly/react-icons' {
  import { ComponentType, SVGAttributes } from 'react';

  export interface IconProps extends SVGAttributes<SVGElement> {
    color?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    title?: string;
    noVerticalAlign?: boolean;
  }

  // Common Icons
  export const CheckCircleIcon: ComponentType<IconProps>;
  export const PlusIcon: ComponentType<IconProps>;
  export const EditIcon: ComponentType<IconProps>;
  export const TrashIcon: ComponentType<IconProps>;
  export const SearchIcon: ComponentType<IconProps>;
  export const TimesIcon: ComponentType<IconProps>;
  export const CloseIcon: ComponentType<IconProps>;

  // Navigation Icons
  export const ChevronDownIcon: ComponentType<IconProps>;
  export const ChevronRightIcon: ComponentType<IconProps>;
  export const ChevronUpIcon: ComponentType<IconProps>;
  export const ChevronLeftIcon: ComponentType<IconProps>;
  export const ArrowUpIcon: ComponentType<IconProps>;
  export const ArrowDownIcon: ComponentType<IconProps>;
  export const ArrowLeftIcon: ComponentType<IconProps>;
  export const ArrowRightIcon: ComponentType<IconProps>;

  // Feature Icons
  export const InboxIcon: ComponentType<IconProps>;
  export const PaperPlaneIcon: ComponentType<IconProps>;
  export const ListIcon: ComponentType<IconProps>;
  export const ChartLineIcon: ComponentType<IconProps>;
  export const CreditCardIcon: ComponentType<IconProps>;
  export const UserIcon: ComponentType<IconProps>;
  export const BellIcon: ComponentType<IconProps>;
  export const ShoppingCartIcon: ComponentType<IconProps>;
  export const CalendarIcon: ComponentType<IconProps>;
  export const ClockIcon: ComponentType<IconProps>;

  // Status Icons
  export const ExclamationCircleIcon: ComponentType<IconProps>;
  export const InfoCircleIcon: ComponentType<IconProps>;
  export const ExclamationTriangleIcon: ComponentType<IconProps>;
  export const CheckIcon: ComponentType<IconProps>;
  export const BanIcon: ComponentType<IconProps>;

  // Action Icons
  export const CogIcon: ComponentType<IconProps>;
  export const FilterIcon: ComponentType<IconProps>;
  export const EllipsisVIcon: ComponentType<IconProps>;
  export const DownloadIcon: ComponentType<IconProps>;
  export const UploadIcon: ComponentType<IconProps>;
  export const SyncIcon: ComponentType<IconProps>;

  // Add more icons as needed
  export const EyeIcon: ComponentType<IconProps>;
  export const EyeSlashIcon: ComponentType<IconProps>;
  export const StarIcon: ComponentType<IconProps>;
  export const HeartIcon: ComponentType<IconProps>;
  export const HomeIcon: ComponentType<IconProps>;
  export const OutlinedQuestionCircleIcon: ComponentType<IconProps>;
}
