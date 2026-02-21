/**
 * Type declarations for @patternfly/react-core
 *
 * This file provides TypeScript declarations for PatternFly React components.
 * PatternFly doesn't ship with official @types, so we declare the module
 * to prevent TypeScript errors.
 *
 * Note: These are minimal declarations to satisfy TypeScript.
 * For full type safety, consider contributing types to DefinitelyTyped.
 */

declare module '@patternfly/react-core' {
  import { ComponentType, ReactNode, CSSProperties, HTMLAttributes } from 'react';

  // ============================================================================
  // Common Types
  // ============================================================================

  export type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'warning' | 'success' | 'info' | 'plain' | 'link' | 'control';
  export type Size = 'sm' | 'md' | 'lg' | 'xl';
  export type Position = 'top' | 'bottom' | 'left' | 'right' | 'auto';

  export interface CommonProps {
    className?: string;
    style?: CSSProperties;
    id?: string;
  }

  // ============================================================================
  // Layout Components
  // ============================================================================

  export interface PageProps extends CommonProps {
    children?: ReactNode;
    header?: ReactNode;
    sidebar?: ReactNode;
    mainContainerId?: string;
  }
  export const Page: ComponentType<PageProps>;

  export interface PageSectionProps extends CommonProps {
    children?: ReactNode;
    variant?: 'default' | 'light' | 'dark';
    padding?: { default?: 'padding' | 'noPadding' };
    isFilled?: boolean;
  }
  export const PageSection: ComponentType<PageSectionProps>;

  export interface FlexProps extends CommonProps {
    children?: ReactNode;
    direction?: { default?: 'column' | 'row' };
    gap?: { default?: string };
    justifyContent?: { default?: string };
    alignItems?: { default?: string };
    wrap?: { default?: 'wrap' | 'nowrap' | 'wrapReverse' };
    spaceItems?: { default?: string };
  }
  export const Flex: ComponentType<FlexProps>;

  export interface FlexItemProps extends CommonProps {
    children?: ReactNode;
    flex?: { default?: string };
    grow?: { default?: string };
    shrink?: { default?: string };
    alignSelf?: { default?: string };
  }
  export const FlexItem: ComponentType<FlexItemProps>;

  export interface GridProps extends CommonProps {
    children?: ReactNode;
    hasGutter?: boolean;
    span?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  }
  export const Grid: ComponentType<GridProps>;

  export interface GridItemProps extends CommonProps {
    children?: ReactNode;
    span?: number;
    rowSpan?: number;
    offset?: number;
  }
  export const GridItem: ComponentType<GridItemProps>;

  // ============================================================================
  // Form Components
  // ============================================================================

  export interface ButtonProps extends CommonProps {
    children?: ReactNode;
    variant?: Variant;
    isDisabled?: boolean;
    isLoading?: boolean;
    isActive?: boolean;
    isBlock?: boolean;
    isDanger?: boolean;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    type?: 'button' | 'submit' | 'reset';
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    component?: any;
    isInline?: boolean;
  }
  export const Button: ComponentType<ButtonProps>;

  export interface TextInputProps extends CommonProps {
    value?: string;
    type?: string;
    placeholder?: string;
    isDisabled?: boolean;
    isReadOnly?: boolean;
    isRequired?: boolean;
    validated?: 'success' | 'warning' | 'error' | 'default';
    onChange?: (value: string, event: React.FormEvent<HTMLInputElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
    name?: string;
    id?: string;
    'aria-label'?: string;
  }
  export const TextInput: ComponentType<TextInputProps>;

  export interface FormProps extends CommonProps {
    children?: ReactNode;
    onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
    isHorizontal?: boolean;
  }
  export const Form: ComponentType<FormProps>;

  export interface FormGroupProps extends CommonProps {
    children?: ReactNode;
    label?: ReactNode;
    labelIcon?: ReactNode;
    isRequired?: boolean;
    fieldId?: string;
    helperText?: ReactNode;
    helperTextInvalid?: ReactNode;
    validated?: 'success' | 'warning' | 'error' | 'default';
  }
  export const FormGroup: ComponentType<FormGroupProps>;

  export interface FormSelectProps extends CommonProps {
    children?: ReactNode;
    value?: string | number;
    onChange?: (value: string, event: React.FormEvent<HTMLSelectElement>) => void;
    isDisabled?: boolean;
    validated?: 'success' | 'warning' | 'error' | 'default';
    name?: string;
    id?: string;
    'aria-label'?: string;
  }
  export const FormSelect: ComponentType<FormSelectProps>;

  export interface FormSelectOptionProps extends CommonProps {
    value?: string | number;
    label?: string;
    isDisabled?: boolean;
    children?: ReactNode;
  }
  export const FormSelectOption: ComponentType<FormSelectOptionProps>;

  export interface CheckboxProps extends CommonProps {
    id: string;
    label?: ReactNode;
    isChecked?: boolean;
    isDisabled?: boolean;
    onChange?: (checked: boolean, event: React.FormEvent<HTMLInputElement>) => void;
    name?: string;
    'aria-label'?: string;
  }
  export const Checkbox: ComponentType<CheckboxProps>;

  // ============================================================================
  // Display Components
  // ============================================================================

  export interface CardProps extends CommonProps {
    children?: ReactNode;
    isCompact?: boolean;
    isFlat?: boolean;
    isRounded?: boolean;
    isSelectable?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
  }
  export const Card: ComponentType<CardProps>;

  export interface CardTitleProps extends CommonProps {
    children?: ReactNode;
  }
  export const CardTitle: ComponentType<CardTitleProps>;

  export interface CardBodyProps extends CommonProps {
    children?: ReactNode;
    isFilled?: boolean;
  }
  export const CardBody: ComponentType<CardBodyProps>;

  export interface CardHeaderProps extends CommonProps {
    children?: ReactNode;
  }
  export const CardHeader: ComponentType<CardHeaderProps>;

  export interface CardFooterProps extends CommonProps {
    children?: ReactNode;
  }
  export const CardFooter: ComponentType<CardFooterProps>;

  export interface TitleProps extends CommonProps {
    children?: ReactNode;
    headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    size?: Size | '2xl' | '3xl' | '4xl';
  }
  export const Title: ComponentType<TitleProps>;

  export interface TextProps extends CommonProps {
    children?: ReactNode;
    component?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  }
  export const Text: ComponentType<TextProps>;

  export interface BadgeProps extends CommonProps {
    children?: ReactNode;
    isRead?: boolean;
  }
  export const Badge: ComponentType<BadgeProps>;

  export interface LabelProps extends CommonProps {
    children?: ReactNode;
    color?: 'blue' | 'cyan' | 'green' | 'orange' | 'purple' | 'red' | 'grey';
    variant?: 'filled' | 'outline';
    isCompact?: boolean;
    onClose?: () => void;
    icon?: ReactNode;
  }
  export const Label: ComponentType<LabelProps>;

  // ============================================================================
  // Navigation Components
  // ============================================================================

  export interface TabsProps extends CommonProps {
    children?: ReactNode;
    activeKey?: string | number;
    onSelect?: (event: React.MouseEvent, tabIndex: string | number) => void;
    isFilled?: boolean;
    isBox?: boolean;
    isVertical?: boolean;
    'aria-label'?: string;
  }
  export const Tabs: ComponentType<TabsProps>;

  export interface TabProps extends CommonProps {
    children?: ReactNode;
    eventKey: string | number;
    title: ReactNode;
    isDisabled?: boolean;
    href?: string;
    tabContentId?: string;
  }
  export const Tab: ComponentType<TabProps>;

  export interface TabTitleTextProps extends CommonProps {
    children?: ReactNode;
  }
  export const TabTitleText: ComponentType<TabTitleTextProps>;

  // ============================================================================
  // Feedback Components
  // ============================================================================

  export interface AlertProps extends CommonProps {
    children?: ReactNode;
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
    title?: ReactNode;
    isInline?: boolean;
    isPlain?: boolean;
    actionClose?: ReactNode;
    actionLinks?: ReactNode;
  }
  export const Alert: ComponentType<AlertProps>;

  export interface SpinnerProps extends CommonProps {
    size?: Size | 'xl';
    'aria-label'?: string;
    'aria-valuetext'?: string;
    isSVG?: boolean;
  }
  export const Spinner: ComponentType<SpinnerProps>;

  export interface ProgressProps extends CommonProps {
    value?: number;
    title?: string;
    min?: number;
    max?: number;
    variant?: 'danger' | 'success' | 'warning';
    measureLocation?: 'top' | 'bottom' | 'inside' | 'outside' | 'none';
    label?: string;
    valueText?: string;
  }
  export const Progress: ComponentType<ProgressProps>;

  export interface TooltipProps extends CommonProps {
    children?: ReactNode;
    content?: ReactNode;
    position?: Position;
    trigger?: string;
    isVisible?: boolean;
    'aria-label'?: string;
  }
  export const Tooltip: ComponentType<TooltipProps>;

  // ============================================================================
  // Modal Components
  // ============================================================================

  export interface ModalProps extends CommonProps {
    children?: ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
    title?: ReactNode;
    titleIconVariant?: Variant;
    variant?: 'small' | 'medium' | 'large' | 'default';
    position?: Position;
    header?: ReactNode;
    footer?: ReactNode;
    actions?: ReactNode[];
    description?: ReactNode;
    showClose?: boolean;
    hasNoBodyWrapper?: boolean;
    'aria-label'?: string;
    'aria-describedby'?: string;
  }
  export const Modal: ComponentType<ModalProps>;

  export interface ModalBoxProps extends CommonProps {
    children?: ReactNode;
  }
  export const ModalBox: ComponentType<ModalBoxProps>;

  export interface ModalBoxBodyProps extends CommonProps {
    children?: ReactNode;
  }
  export const ModalBoxBody: ComponentType<ModalBoxBodyProps>;

  export interface ModalBoxFooterProps extends CommonProps {
    children?: ReactNode;
  }
  export const ModalBoxFooter: ComponentType<ModalBoxFooterProps>;

  // ============================================================================
  // Table Components
  // ============================================================================

  export interface TableProps extends CommonProps {
    children?: ReactNode;
    'aria-label'?: string;
    variant?: 'compact';
    borders?: boolean;
    isStickyHeader?: boolean;
  }
  export const Table: ComponentType<TableProps>;

  export interface TheadProps extends CommonProps {
    children?: ReactNode;
  }
  export const Thead: ComponentType<TheadProps>;

  export interface TbodyProps extends CommonProps {
    children?: ReactNode;
  }
  export const Tbody: ComponentType<TbodyProps>;

  export interface TrProps extends CommonProps {
    children?: ReactNode;
  }
  export const Tr: ComponentType<TrProps>;

  export interface ThProps extends CommonProps {
    children?: ReactNode;
    sort?: any;
    width?: number;
  }
  export const Th: ComponentType<ThProps>;

  export interface TdProps extends CommonProps {
    children?: ReactNode;
    dataLabel?: string;
  }
  export const Td: ComponentType<TdProps>;

  // ============================================================================
  // List Components
  // ============================================================================

  export interface ListProps extends CommonProps {
    children?: ReactNode;
    isPlain?: boolean;
    isBordered?: boolean;
  }
  export const List: ComponentType<ListProps>;

  export interface ListItemProps extends CommonProps {
    children?: ReactNode;
    icon?: ReactNode;
  }
  export const ListItem: ComponentType<ListItemProps>;

  // ============================================================================
  // Menu Components
  // ============================================================================

  export interface DropdownProps extends CommonProps {
    children?: ReactNode;
    isOpen?: boolean;
    onSelect?: (event?: any) => void;
    toggle?: ReactNode;
    isPlain?: boolean;
    position?: Position;
    direction?: 'up' | 'down';
  }
  export const Dropdown: ComponentType<DropdownProps>;

  export interface DropdownItemProps extends CommonProps {
    children?: ReactNode;
    onClick?: (event: React.MouseEvent) => void;
    isDisabled?: boolean;
    component?: any;
    href?: string;
    icon?: ReactNode;
  }
  export const DropdownItem: ComponentType<DropdownItemProps>;

  export interface DropdownToggleProps extends CommonProps {
    children?: ReactNode;
    onToggle?: (isOpen: boolean) => void;
    isDisabled?: boolean;
    isPlain?: boolean;
    isPrimary?: boolean;
    splitButtonItems?: ReactNode[];
  }
  export const DropdownToggle: ComponentType<DropdownToggleProps>;

  // ============================================================================
  // Utility Components
  // ============================================================================

  export interface ExpandableProps extends CommonProps {
    children?: ReactNode;
    toggleText?: string;
    isExpanded?: boolean;
    onToggle?: (isExpanded: boolean) => void;
  }
  export const Expandable: ComponentType<ExpandableProps>;

  export interface PaginationProps extends CommonProps {
    itemCount?: number;
    perPage?: number;
    page?: number;
    onSetPage?: (event: React.MouseEvent | React.KeyboardEvent, page: number) => void;
    onPerPageSelect?: (event: React.MouseEvent | React.KeyboardEvent, perPage: number) => void;
    variant?: 'top' | 'bottom';
    isCompact?: boolean;
    isDisabled?: boolean;
  }
  export const Pagination: ComponentType<PaginationProps>;

  export interface EmptyStateProps extends CommonProps {
    children?: ReactNode;
    variant?: 'xs' | 'small' | 'large' | 'xl' | 'full';
  }
  export const EmptyState: ComponentType<EmptyStateProps>;

  export interface EmptyStateIconProps extends CommonProps {
    icon?: ComponentType<any>;
  }
  export const EmptyStateIcon: ComponentType<EmptyStateIconProps>;

  export interface EmptyStateBodyProps extends CommonProps {
    children?: ReactNode;
  }
  export const EmptyStateBody: ComponentType<EmptyStateBodyProps>;

  // ============================================================================
  // Export all
  // ============================================================================

  export default {
    Page,
    PageSection,
    Flex,
    FlexItem,
    Grid,
    GridItem,
    Button,
    TextInput,
    Form,
    FormGroup,
    FormSelect,
    FormSelectOption,
    Checkbox,
    Card,
    CardTitle,
    CardBody,
    CardHeader,
    CardFooter,
    Title,
    Text,
    Badge,
    Label,
    Tabs,
    Tab,
    TabTitleText,
    Alert,
    Spinner,
    Progress,
    Tooltip,
    Modal,
    ModalBox,
    ModalBoxBody,
    ModalBoxFooter,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    List,
    ListItem,
    Dropdown,
    DropdownItem,
    DropdownToggle,
    Expandable,
    Pagination,
    EmptyState,
    EmptyStateIcon,
    EmptyStateBody,
  };
}
