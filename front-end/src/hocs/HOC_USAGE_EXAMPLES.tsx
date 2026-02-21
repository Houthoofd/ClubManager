/**
 * EXEMPLES D'UTILISATION DES HOCs
 *
 * Ce fichier contient des exemples concrets d'utilisation de tous les HOCs
 * disponibles dans le projet ClubManager.
 */

import React from 'react';
import {
  withAuth,
  withAuthRole,
  useRequireAuth,
  useRequireRole,
} from './withAuth';
import {
  withLoading,
  useLoadingWrapper,
} from './withLoading';
import {
  withData,
  withQuery,
  withPaginatedData,
} from './withData';
import {
  withTracking,
  useTracking,
} from './withTracking';
import {
  withErrorBoundary,
  ErrorBoundary,
} from './withErrorBoundary';
import {
  withPermissions,
  usePermissions,
  RequirePermissions,
} from './withPermissions';
import { gql } from '@apollo/client';

/* ============================================
   1. withAuth - Protection des routes
   ============================================ */

// Exemple basique : protéger une page
const DashboardPage = () => <div>Dashboard privé</div>;
const ProtectedDashboard = withAuth(DashboardPage);

// Avec options personnalisées
const ProfilePage = () => <div>Mon profil</div>;
const ProtectedProfile = withAuth(ProfilePage, {
  redirectTo: '/unauthorized',
  showLoader: true,
});

// Utilisation avec hook
const MyProtectedComponent = () => {
  useRequireAuth({ redirectTo: '/login' });
  return <div>Contenu protégé</div>;
};

/* ============================================
   2. withAuthRole - Protection par rôle
   ============================================ */

// Restreindre aux admins uniquement
const AdminPanel = () => <div>Panel Admin</div>;
const AdminOnlyPanel = withAuthRole(AdminPanel, ['admin'], {
  unauthorizedRedirect: '/dashboard',
});

// Restreindre aux enseignants et admins
const TeacherTools = () => <div>Outils enseignant</div>;
const TeacherOnlyTools = withAuthRole(TeacherTools, ['admin', 'teacher']);

// Avec hook
const RoleBasedComponent = () => {
  const { hasAccess } = useRequireRole(['admin', 'teacher']);

  if (!hasAccess) {
    return <div>Accès refusé</div>;
  }

  return <div>Contenu pour enseignants</div>;
};

/* ============================================
   3. withLoading - États de chargement
   ============================================ */

// Avec spinner par défaut
const UserProfile = ({ user }: any) => <div>{user.name}</div>;
const UserProfileWithLoading = withLoading(UserProfile, {
  type: 'spinner',
  spinnerSize: 'xl',
});

// Usage: <UserProfileWithLoading isLoading={loading} user={data?.user} />

// Avec skeleton loader
const CourseList = ({ courses }: any) => (
  <div>{courses.map((c: any) => <div key={c.id}>{c.title}</div>)}</div>
);
const CourseListWithSkeleton = withLoading(CourseList, {
  type: 'skeleton',
  skeletonRows: 5,
  minLoadingTime: 300, // Évite le flash
});

// Avec overlay (charge par dessus le contenu)
const DataTable = ({ data }: any) => <table>{/* ... */}</table>;
const DataTableWithOverlay = withLoading(DataTable, {
  type: 'spinner',
  overlay: true,
});

// Utilisation avec hook
const ComponentWithLoadingHook = ({ loading, data }: any) => {
  const LoadingWrapper = useLoadingWrapper({ type: 'skeleton' });

  return (
    <LoadingWrapper isLoading={loading}>
      <div>{data}</div>
    </LoadingWrapper>
  );
};

/* ============================================
   4. withData - Fetching de données GraphQL
   ============================================ */

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

// Exemple basique
const UserCard = ({ data }: any) => (
  <div>
    <h2>{data.name}</h2>
    <p>{data.email}</p>
  </div>
);

const UserCardWithData = withData({
  query: GET_USER,
  variables: (props: any) => ({ id: props.userId }),
  dataKey: 'user',
})(UserCard);

// Usage: <UserCardWithData userId="123" />

// Avec withQuery (plus simple)
const GET_COURSES = gql`
  query GetCourses {
    courses {
      id
      title
    }
  }
`;

const CourseListSimple = ({ data }: any) => (
  <div>{data.map((c: any) => <div key={c.id}>{c.title}</div>)}</div>
);

const CourseListWithQuery = withQuery(GET_COURSES, 'courses')(CourseListSimple);

// Avec pagination
const GET_PAGINATED_COURSES = gql`
  query GetCourses($limit: Int!, $offset: Int!) {
    courses(limit: $limit, offset: $offset) {
      id
      title
    }
  }
`;

const PaginatedCourseList = ({ data, loadMore, hasMore }: any) => (
  <div>
    {data.map((c: any) => <div key={c.id}>{c.title}</div>)}
    {hasMore && <button onClick={loadMore}>Charger plus</button>}
  </div>
);

const PaginatedCourseListWithData = withPaginatedData({
  query: GET_PAGINATED_COURSES,
  dataKey: 'courses',
  pageSize: 20,
})(PaginatedCourseList);

/* ============================================
   5. withTracking - Analytics et télémétrie
   ============================================ */

// Tracker les vues de page
const StatisticsPage = () => <div>Statistiques</div>;
const TrackedStatisticsPage = withTracking({
  eventName: 'statistics_page',
  trackPageView: true,
  properties: { section: 'analytics' },
})(StatisticsPage);

// Tracker les interactions
const TrackedButton = withTracking({
  eventName: 'important_button',
  trackLifecycle: false,
})(({ track }: any) => (
  <button onClick={() => track('button_clicked', { action: 'submit' })}>
    Cliquez-moi
  </button>
));

// Utilisation avec hook
const ComponentWithTracking = () => {
  const track = useTracking();

  const handleAction = () => {
    track('user_action', { type: 'download', fileId: '123' });
  };

  return <button onClick={handleAction}>Télécharger</button>;
};

/* ============================================
   6. withErrorBoundary - Gestion d'erreurs
   ============================================ */

// Protéger un composant contre les erreurs
const RiskyComponent = () => {
  // Ce composant peut lancer des erreurs
  return <div>Contenu risqué</div>;
};

const SafeRiskyComponent = withErrorBoundary(RiskyComponent, {
  componentName: 'RiskyComponent',
  reportToSentry: true,
  onError: (error) => console.error('Erreur capturée:', error),
});

// Avec fallback personnalisé
const CustomErrorFallback = ({ error, resetError }: any) => (
  <div>
    <h2>Oups! Quelque chose s'est mal passé</h2>
    <p>{error?.message}</p>
    <button onClick={resetError}>Réessayer</button>
  </div>
);

const ComponentWithCustomError = withErrorBoundary(RiskyComponent, {
  fallback: CustomErrorFallback,
});

// Utilisation directe du composant ErrorBoundary
const FeatureWithErrorBoundary = () => (
  <ErrorBoundary componentName="MyFeature" reportToSentry={true}>
    <RiskyComponent />
  </ErrorBoundary>
);

/* ============================================
   7. withPermissions - Contrôle d'accès
   ============================================ */

// Restreindre par rôle
const AdminSettings = () => <div>Paramètres admin</div>;
const ProtectedAdminSettings = withPermissions(AdminSettings, {
  allowedRoles: ['admin'],
});

// Restreindre par permissions
const CourseEditor = () => <div>Éditeur de cours</div>;
const ProtectedCourseEditor = withPermissions(CourseEditor, {
  requiredPermissions: ['courses.edit', 'courses.create'],
  requireAll: false, // Au moins une permission
});

// Avec redirection
const SecretPage = () => <div>Page secrète</div>;
const ProtectedSecretPage = withPermissions(SecretPage, {
  allowedRoles: ['admin'],
  redirectTo: '/dashboard',
});

// Utilisation avec hook
const ConditionalContent = () => {
  const { hasPermission, hasRole } = usePermissions();

  return (
    <div>
      {hasRole('admin') && <button>Admin Action</button>}
      {hasPermission('courses.edit') && <button>Éditer</button>}
      {hasPermission('courses.delete') && <button>Supprimer</button>}
    </div>
  );
};

// Utilisation avec composant RequirePermissions
const ConditionalUI = () => (
  <div>
    <RequirePermissions allowedRoles={['admin']}>
      <button>Action Admin</button>
    </RequirePermissions>

    <RequirePermissions
      requiredPermissions={['courses.delete']}
      fallback={<span>Pas de permission</span>}
    >
      <button>Supprimer</button>
    </RequirePermissions>
  </div>
);

/* ============================================
   8. COMPOSITION DE PLUSIEURS HOCs
   ============================================ */

// Combiner plusieurs HOCs
const ComplexComponent = ({ data, track }: any) => (
  <div onClick={() => track('complex_clicked')}>
    {data.title}
  </div>
);

// Approche 1: Chaînage manuel
const EnhancedComponent1 = withAuth(
  withErrorBoundary(
    withTracking({ eventName: 'complex_component' })(
      withLoading(ComplexComponent, { type: 'skeleton' })
    ),
    { componentName: 'ComplexComponent' }
  )
);

// Approche 2: Fonction compose
const compose = (...fns: Function[]) => (x: any) =>
  fns.reduceRight((v, f) => f(v), x);

const EnhancedComponent2 = compose(
  withAuth,
  (comp: any) => withErrorBoundary(comp, { componentName: 'ComplexComponent' }),
  (comp: any) => withTracking({ eventName: 'complex_component' })(comp),
  (comp: any) => withLoading(comp, { type: 'skeleton' })
)(ComplexComponent);

/* ============================================
   9. EXEMPLES PRATIQUES PAR FEATURE
   ============================================ */

// Page de profil complète
const ProfilePageComplete = ({ data, track }: any) => (
  <div onClick={() => track('profile_viewed')}>
    <h1>{data.name}</h1>
    <p>{data.email}</p>
  </div>
);

export const EnhancedProfilePage = compose(
  withAuth,
  (comp: any) => withErrorBoundary(comp, { componentName: 'ProfilePage' }),
  (comp: any) => withTracking({ eventName: 'profile_page', trackPageView: true })(comp),
  (comp: any) => withData({
    query: GET_USER,
    variables: (props: any) => ({ id: props.userId }),
    dataKey: 'user',
  })(comp)
)(ProfilePageComplete);

// Dashboard admin avec toutes les protections
const AdminDashboardComponent = ({ data }: any) => (
  <div>
    <h1>Admin Dashboard</h1>
    {/* Contenu */}
  </div>
);

export const AdminDashboard = compose(
  (comp: any) => withAuthRole(comp, ['admin']),
  (comp: any) => withErrorBoundary(comp, { componentName: 'AdminDashboard' }),
  (comp: any) => withTracking({
    eventName: 'admin_dashboard',
    trackPageView: true
  })(comp),
  (comp: any) => withLoading(comp, { type: 'spinner' })
)(AdminDashboardComponent);

// Liste de cours avec pagination et tracking
const CoursesListComponent = ({ data, loadMore, hasMore, track }: any) => (
  <div>
    {data.map((course: any) => (
      <div
        key={course.id}
        onClick={() => track('course_clicked', { courseId: course.id })}
      >
        {course.title}
      </div>
    ))}
    {hasMore && <button onClick={loadMore}>Charger plus</button>}
  </div>
);

export const EnhancedCoursesList = compose(
  (comp: any) => withErrorBoundary(comp, { componentName: 'CoursesList' }),
  (comp: any) => withTracking({ eventName: 'courses_list' })(comp),
  (comp: any) => withPaginatedData({
    query: GET_PAGINATED_COURSES,
    dataKey: 'courses',
    pageSize: 20,
  })(comp)
)(CoursesListComponent);

/* ============================================
   10. BONNES PRATIQUES
   ============================================ */

/**
 * 1. Ordre des HOCs (de l'extérieur vers l'intérieur):
 *    - withAuth / withAuthRole (auth en premier)
 *    - withErrorBoundary (capturer toutes les erreurs)
 *    - withTracking (tracker les événements)
 *    - withPermissions (contrôle d'accès spécifique)
 *    - withData / withLoading (data fetching)
 *    - Composant final
 *
 * 2. Toujours nommer les composants exportés:
 *    export const MyComponent = withAuth(BaseComponent);
 *
 * 3. Préférer les hooks dans les composants fonctionnels:
 *    const track = useTracking();
 *    useRequireAuth();
 *
 * 4. Utiliser compose() pour plus de 2 HOCs
 *
 * 5. Toujours spécifier componentName dans withErrorBoundary
 *
 * 6. Activer reportToSentry en production
 *
 * 7. Utiliser minLoadingTime pour éviter les flashs de chargement
 */

export default {
  ProtectedDashboard,
  AdminOnlyPanel,
  UserProfileWithLoading,
  CourseListWithSkeleton,
  TrackedStatisticsPage,
  SafeRiskyComponent,
  ProtectedAdminSettings,
  EnhancedProfilePage,
  AdminDashboard,
  EnhancedCoursesList,
};
