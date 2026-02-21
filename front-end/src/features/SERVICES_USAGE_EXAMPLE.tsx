/**
 * ====================================================================
 * SERVICES USAGE EXAMPLE
 * ====================================================================
 *
 * Exemples de refactoring pour séparer la logique métier des composants.
 * Montre comment utiliser les services pour améliorer la maintenabilité.
 */

import React from 'react';
import { Card, CardBody, Button, Badge, List, ListItem } from '@patternfly/react-core';
import { UserService } from './users/services';
import { CourseService } from './courses/services';
import { ProductService } from './shop/services';
import type { User } from './users/services';
import type { Session } from './courses/services';
import type { Product, CartItem } from './shop/services';

// ============================================================================
// ❌ AVANT - Logique mélangée dans le composant
// ============================================================================

const UserCardBefore: React.FC<{ user: any }> = ({ user }) => {
  // ❌ Logique métier directement dans le composant
  const fullName = `${user.prenom} ${user.nom}`;

  const birthDate = new Date(user.dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  const hasSubscription = user.abonnement && user.abonnement.actif && new Date(user.abonnement.dateFin) > new Date();

  let statusColor = 'default';
  if (user.statut === 'ACTIF') statusColor = 'green';
  if (user.statut === 'SUSPENDU') statusColor = 'orange';
  if (user.statut === 'INACTIF') statusColor = 'grey';

  return (
    <Card>
      <CardBody>
        <h3>{fullName}</h3>
        <p>Âge: {age} ans</p>
        <Badge color={statusColor as any}>{user.statut}</Badge>
        {hasSubscription && <Badge color="blue">Abonné</Badge>}
      </CardBody>
    </Card>
  );
};

// ============================================================================
// ✅ APRÈS - Logique déléguée aux services
// ============================================================================

const UserCardAfter: React.FC<{ user: User }> = ({ user }) => {
  // ✅ Logique métier dans les services - Composant lean et lisible
  const fullName = UserService.formatUserFullName(user);
  const age = UserService.calculateUserAge(user.dateNaissance!);
  const hasSubscription = UserService.hasActiveSubscription(user);
  const statusInfo = UserService.formatUserStatus(user.statut);
  const initials = UserService.getUserInitials(user);

  return (
    <Card>
      <CardBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#0066cc',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            {initials}
          </div>
          <div>
            <h3>{fullName}</h3>
            <p>Âge: {age} ans</p>
          </div>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <Badge color={statusInfo.variant as any}>{statusInfo.label}</Badge>
          {hasSubscription && <Badge color="blue">Abonné actif</Badge>}
        </div>
      </CardBody>
    </Card>
  );
};

// ============================================================================
// EXEMPLE: Liste de sessions avec filtrage et tri
// ============================================================================

const SessionListExample: React.FC<{ sessions: Session[] }> = ({ sessions }) => {
  // ✅ Utilisation des services pour la logique métier
  const [filteredSessions, setFilteredSessions] = React.useState(sessions);

  const handleFilter = () => {
    // Filtre uniquement les sessions disponibles et futures
    const available = CourseService.filterSessions(sessions, {
      onlyAvailable: true,
      statut: 'SCHEDULED',
    });

    // Trie par date
    const sorted = CourseService.sortSessionsByDate(available, 'asc');

    setFilteredSessions(sorted);
  };

  return (
    <div>
      <Button onClick={handleFilter}>Afficher sessions disponibles</Button>

      <List>
        {filteredSessions.map((session) => {
          const timeSlot = CourseService.formatSessionTimeSlot(session);
          const date = CourseService.formatSessionDate(session.date);
          const availableSeats = CourseService.getAvailableSeats(session);
          const occupancy = CourseService.getOccupancyRate(session);
          const canEnroll = CourseService.canEnrollInSession(session);
          const isFull = CourseService.isSessionFull(session);
          const isToday = CourseService.isSessionToday(session);

          return (
            <ListItem key={session.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div>
                  <strong>{session.course.nom}</strong>
                  {isToday && <Badge color="purple">Aujourd'hui</Badge>}
                  <p>{date} • {timeSlot}</p>
                  <p>
                    {availableSeats} places disponibles
                    ({occupancy}% de remplissage)
                  </p>
                </div>
                <div>
                  {isFull ? (
                    <Badge color="red">Complet</Badge>
                  ) : (
                    <Button
                      isDisabled={!canEnroll.canEnroll}
                      title={canEnroll.reason}
                    >
                      S'inscrire
                    </Button>
                  )}
                </div>
              </div>
            </ListItem>
          );
        })}
      </List>
    </div>
  );
};

// ============================================================================
// EXEMPLE: Panier avec calculs
// ============================================================================

const ShoppingCartExample: React.FC<{ items: CartItem[] }> = ({ items }) => {
  // ✅ Tous les calculs délégués au service
  const subtotal = ProductService.calculateCartSubtotal(items);
  const savings = ProductService.calculateCartSavings(items);
  const itemCount = ProductService.getCartItemCount(items);
  const validation = ProductService.validateCart(items);

  // Calcul du récapitulatif complet avec taxes
  const summary = ProductService.calculateCartSummary(items);

  const handleCheckout = () => {
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }

    // Procéder au paiement
    console.log('Checkout:', summary);
  };

  return (
    <Card>
      <CardBody>
        <h2>Panier ({itemCount} articles)</h2>

        <List>
          {items.map((item) => {
            const price = ProductService.formatPrice(ProductService.getEffectivePrice(item.product));
            const discount = ProductService.getDiscountPercentage(item.product);
            const stockLevel = ProductService.getStockLevel(item.product);
            const stockInfo = ProductService.formatStockStatus(item.product);
            const lineTotal = ProductService.formatPrice(
              ProductService.getEffectivePrice(item.product) * item.quantity
            );

            return (
              <ListItem key={item.product.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <strong>{item.product.nom}</strong>
                    {discount > 0 && (
                      <Badge color="green">-{discount}%</Badge>
                    )}
                    <p>
                      {price} × {item.quantity} = {lineTotal}
                    </p>
                    <Badge color={stockInfo.variant as any}>
                      {stockInfo.label}
                    </Badge>
                  </div>
                </div>
              </ListItem>
            );
          })}
        </List>

        <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Sous-total:</span>
            <strong>{ProductService.formatPrice(summary.subtotal)}</strong>
          </div>

          {summary.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}>
              <span>Économies:</span>
              <strong>-{ProductService.formatPrice(summary.discount)}</strong>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>TVA (21%):</span>
            <span>{ProductService.formatPrice(summary.tax)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              marginTop: '0.5rem',
            }}
          >
            <span>Total:</span>
            <span>{ProductService.formatPrice(summary.total)}</span>
          </div>
        </div>

        <Button
          onClick={handleCheckout}
          isDisabled={!validation.valid}
          style={{ marginTop: '1rem', width: '100%' }}
        >
          Passer la commande
        </Button>

        {!validation.valid && (
          <div style={{ marginTop: '1rem', color: 'red' }}>
            {validation.errors.map((error, i) => (
              <p key={i}>⚠️ {error}</p>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// ============================================================================
// EXEMPLE: Dashboard avec statistiques
// ============================================================================

const DashboardExample: React.FC<{
  users: User[];
  sessions: Session[];
  products: Product[];
}> = ({ users, sessions, products }) => {
  // ✅ Calculs de stats déléguées aux services
  const userStats = UserService.calculateUserStats(users);
  const sessionStats = CourseService.calculateSessionStats(sessions);
  const productStats = ProductService.calculateProductStats(products);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      {/* Stats Utilisateurs */}
      <Card>
        <CardBody>
          <h3>Utilisateurs</h3>
          <p>Total: {userStats.totalUsers}</p>
          <p>Actifs: {userStats.activeUsers}</p>
          <p>Nouveaux ce mois: {userStats.newUsersThisMonth}</p>
          <p>Taux d'abonnement: {userStats.subscriptionRate}%</p>
          {userStats.averageAge && <p>Âge moyen: {userStats.averageAge} ans</p>}
        </CardBody>
      </Card>

      {/* Stats Sessions */}
      <Card>
        <CardBody>
          <h3>Sessions</h3>
          <p>Total: {sessionStats.totalSessions}</p>
          <p>Planifiées: {sessionStats.scheduledSessions}</p>
          <p>Terminées: {sessionStats.completedSessions}</p>
          <p>Taux de remplissage: {sessionStats.averageOccupancy}%</p>
          <p>Revenu total: {ProductService.formatPrice(sessionStats.totalRevenue)}</p>
        </CardBody>
      </Card>

      {/* Stats Produits */}
      <Card>
        <CardBody>
          <h3>Produits</h3>
          <p>Total: {productStats.totalProducts}</p>
          <p>Actifs: {productStats.activeProducts}</p>
          <p>Stock faible: {productStats.lowStockProducts}</p>
          <p>Rupture: {productStats.outOfStockProducts}</p>
          <p>Prix moyen: {ProductService.formatPrice(productStats.averagePrice)}</p>
          <p>Valeur stock: {ProductService.formatPrice(productStats.totalInventoryValue)}</p>
        </CardBody>
      </Card>
    </div>
  );
};

// ============================================================================
// AVANTAGES DE CETTE APPROCHE
// ============================================================================

/**
 * ✅ AVANTAGES:
 *
 * 1. **Composants plus simples et lisibles**
 *    - Pas de calculs complexes dans le JSX
 *    - Focalisés sur l'affichage (UI)
 *
 * 2. **Logique réutilisable**
 *    - Même calcul utilisable dans plusieurs composants
 *    - Pas de duplication de code
 *
 * 3. **Testabilité**
 *    - Fonctions pures faciles à tester unitairement
 *    - Pas besoin de monter des composants React pour tester la logique
 *
 * 4. **Maintenance facilitée**
 *    - Changement dans 1 seul endroit
 *    - Impacts propagés automatiquement
 *
 * 5. **Typage fort**
 *    - TypeScript garantit la cohérence
 *    - Auto-complétion dans l'IDE
 *
 * 6. **Séparation des responsabilités**
 *    - Services = logique métier
 *    - Hooks = état et side-effects
 *    - Composants = affichage
 */

/**
 * 📝 EXEMPLES DE TESTS UNITAIRES:
 *
 * ```ts
 * import { UserService } from '@/features/users/services';
 *
 * describe('UserService', () => {
 *   it('should calculate user age correctly', () => {
 *     const birthDate = '2000-01-01';
 *     const age = UserService.calculateUserAge(birthDate);
 *     expect(age).toBeGreaterThan(20);
 *   });
 *
 *   it('should format full name correctly', () => {
 *     const user = { nom: 'Dupont', prenom: 'Jean' };
 *     expect(UserService.formatUserFullName(user)).toBe('Jean Dupont');
 *   });
 *
 *   it('should detect active subscription', () => {
 *     const user = {
 *       abonnement: {
 *         actif: true,
 *         dateFin: new Date(Date.now() + 86400000).toISOString()
 *       }
 *     };
 *     expect(UserService.hasActiveSubscription(user)).toBe(true);
 *   });
 * });
 * ```
 */

export {
  UserCardBefore,
  UserCardAfter,
  SessionListExample,
  ShoppingCartExample,
  DashboardExample,
};
