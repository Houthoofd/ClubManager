# API Routes Documentation

Documentation complète des routes API du ClubManager Platform.

---

## 📋 Table des matières

1. [Routes Produits](#routes-produits)
2. [Routes Inventaire](#routes-inventaire)
3. [Routes Commandes](#routes-commandes)
4. [Routes Messagerie](#routes-messagerie)

---

## 🛍️ Routes Produits

Base URL: `/api/products`

### GET /api/products
Liste tous les produits avec filtres et pagination.

**Query Parameters:**
- `page` (number, optionnel): Numéro de page (défaut: 1)
- `limit` (number, optionnel): Nombre d'éléments par page (défaut: 20, max: 100)
- `status` (string, optionnel): Filtrer par statut (ACTIVE, INACTIVE, OUT_OF_STOCK, DISCONTINUED)
- `categoryId` (number, optionnel): Filtrer par catégorie
- `search` (string, optionnel): Recherche dans nom et description
- `minPrice` (number, optionnel): Prix minimum
- `maxPrice` (number, optionnel): Prix maximum
- `inStock` (boolean, optionnel): Afficher uniquement produits en stock

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Kimono Judo",
      "description": "Kimono de judo professionnel",
      "price": 89.99,
      "stock": 15,
      "status": "ACTIVE",
      "categoryId": 1,
      "imageUrl": "https://...",
      "tenantId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/products/stats
Obtenir les statistiques des produits.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 45,
    "activeProducts": 38,
    "outOfStock": 3,
    "totalValue": 15678.50,
    "lowStockProducts": [
      {
        "id": 5,
        "name": "Ceinture noire",
        "stock": 3
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/products/low-stock
Obtenir les produits avec stock faible.

**Query Parameters:**
- `threshold` (number, optionnel): Seuil de stock faible (défaut: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "Ceinture noire",
      "stock": 3,
      "price": 25.99,
      "status": "ACTIVE"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/products/out-of-stock
Obtenir les produits en rupture de stock.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "name": "Protège-tibias",
      "stock": 0,
      "status": "OUT_OF_STOCK"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/products/:id
Obtenir un produit par ID.

**Path Parameters:**
- `id` (number, requis): ID du produit

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Kimono Judo",
    "description": "Kimono de judo professionnel",
    "price": 89.99,
    "stock": 15,
    "status": "ACTIVE",
    "categoryId": 1,
    "imageUrl": "https://...",
    "tenantId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /api/products
Créer un nouveau produit.

**Body:**
```json
{
  "name": "Kimono Karaté",
  "description": "Kimono de karaté traditionnel",
  "price": 79.99,
  "stock": 20,
  "categoryId": 1,
  "imageUrl": "https://...",
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 46,
    "name": "Kimono Karaté",
    "price": 79.99,
    "stock": 20,
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Product created successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### PUT /api/products/:id
Mettre à jour un produit.

**Path Parameters:**
- `id` (number, requis): ID du produit

**Body:**
```json
{
  "name": "Kimono Karaté Premium",
  "price": 99.99,
  "stock": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 46,
    "name": "Kimono Karaté Premium",
    "price": 99.99,
    "stock": 15,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Product updated successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /api/products/:id/stock
Mettre à jour le stock d'un produit.

**Path Parameters:**
- `id` (number, requis): ID du produit

**Body:**
```json
{
  "stock": 25
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 46,
    "stock": 25,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Stock updated successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /api/products/:id/activate
Activer un produit.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 46,
    "status": "ACTIVE"
  },
  "message": "Product activated successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /api/products/:id/deactivate
Désactiver un produit.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 46,
    "status": "INACTIVE"
  },
  "message": "Product deactivated successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### DELETE /api/products/:id
Supprimer un produit (soft delete).

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Product deleted successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 📦 Routes Inventaire

Base URL: `/api/inventory`

### GET /api/inventory/summary
Obtenir un résumé de l'inventaire.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 45,
    "totalValue": 15678.50,
    "lowStockCount": 5,
    "outOfStockCount": 3,
    "statusBreakdown": {
      "ACTIVE": 38,
      "INACTIVE": 2,
      "OUT_OF_STOCK": 3,
      "DISCONTINUED": 2
    },
    "alerts": {
      "critical": 2,
      "warning": 3
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/inventory/alerts
Obtenir les alertes de stock faible.

**Query Parameters:**
- `threshold` (number, optionnel): Seuil d'alerte (défaut: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "Ceinture noire",
      "currentStock": 3,
      "threshold": 10,
      "severity": "critical",
      "needsReorder": true
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/inventory/out-of-stock
Obtenir les produits en rupture de stock.

**Response:** (similaire à GET /api/products/out-of-stock)

---

### POST /api/inventory/check-availability
Vérifier la disponibilité de plusieurs produits.

**Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 5
    },
    {
      "productId": 2,
      "quantity": 3
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allAvailable": true,
    "items": [
      {
        "productId": 1,
        "productName": "Kimono Judo",
        "requestedQuantity": 5,
        "availableStock": 15,
        "available": true,
        "reason": null
      },
      {
        "productId": 2,
        "productName": "Gants MMA",
        "requestedQuantity": 3,
        "availableStock": 8,
        "available": true,
        "reason": null
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /api/inventory/:productId/add
Ajouter du stock à un produit.

**Path Parameters:**
- `productId` (number, requis): ID du produit

**Body:**
```json
{
  "quantity": 10,
  "reason": "Réapprovisionnement"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "stock": 25
  },
  "message": "Stock added successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /api/inventory/:productId/remove
Retirer du stock d'un produit.

**Path Parameters:**
- `productId` (number, requis): ID du produit

**Body:**
```json
{
  "quantity": 5,
  "reason": "Produit endommagé"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "stock": 20
  },
  "message": "Stock removed successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### PUT /api/inventory/:productId/set
Définir le stock à une valeur spécifique.

**Path Parameters:**
- `productId` (number, requis): ID du produit

**Body:**
```json
{
  "quantity": 30,
  "reason": "Inventaire physique"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "stock": 30
  },
  "message": "Stock set successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /api/inventory/bulk-update
Mise à jour en masse de l'inventaire.

**Body:**
```json
{
  "updates": [
    {
      "productId": 1,
      "quantity": 10,
      "type": "ADD",
      "reason": "Réapprovisionnement"
    },
    {
      "productId": 2,
      "quantity": 20,
      "type": "SET",
      "reason": "Inventaire"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "successful": [
      {
        "productId": 1,
        "oldStock": 15,
        "newStock": 25,
        "success": true
      }
    ],
    "failed": [],
    "total": 2,
    "successCount": 2,
    "failureCount": 0
  },
  "message": "Bulk update completed: 2 successful, 0 failed",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /api/inventory/reserve
Réserver du stock pour une commande.

**Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "orderId": 123
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "productId": 1,
        "quantity": 2,
        "reservedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "success": true
  },
  "message": "Stock reserved successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /api/inventory/release
Libérer le stock réservé.

**Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "orderId": 123
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "message": "Stock released successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🛒 Routes Commandes

Base URL: `/api/orders`

### GET /api/orders
Liste toutes les commandes avec filtres et pagination.

**Query Parameters:**
- `page` (number, optionnel): Numéro de page
- `limit` (number, optionnel): Nombre d'éléments par page
- `status` (string, optionnel): PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED, REFUNDED
- `userId` (number, optionnel): Filtrer par utilisateur
- `startDate` (string, optionnel): Date de début (ISO 8601)
- `endDate` (string, optionnel): Date de fin (ISO 8601)
- `minAmount` (number, optionnel): Montant minimum
- `maxAmount` (number, optionnel): Montant maximum

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 5,
      "status": "CONFIRMED",
      "totalAmount": 179.98,
      "notes": "Livraison rapide SVP",
      "tenantId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "items": [
        {
          "id": 1,
          "productId": 1,
          "quantity": 2,
          "price": 89.99,
          "subtotal": 179.98,
          "product": {
            "id": 1,
            "name": "Kimono Judo"
          }
        }
      ],
      "user": {
        "id": 5,
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/orders/stats
Obtenir les statistiques des commandes.

**Query Parameters:**
- `startDate` (string, optionnel): Date de début
- `endDate` (string, optionnel): Date de fin

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 156,
    "totalRevenue": 45678.90,
    "averageOrderValue": 293.07,
    "ordersByStatus": {
      "PENDING": 12,
      "CONFIRMED": 25,
      "PREPARING": 18,
      "READY": 8,
      "DELIVERED": 89,
      "CANCELLED": 3,
      "REFUNDED": 1
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/orders/recent
Obtenir les commandes récentes.

**Query Parameters:**
- `limit` (number, optionnel): Nombre de commandes (défaut: 10)

**Response:** (similaire à GET /api/orders)

---

### GET /api/orders/user/:userId
Obtenir les commandes d'un utilisateur.

**Path Parameters:**
- `userId` (number, requis): ID de l'utilisateur

**Query Parameters:**
- `page`, `limit` (pagination)

**Response:** (similaire à GET /api/orders)

---

### GET /api/orders/product/:productId
Obtenir les commandes contenant un produit.

**Path Parameters:**
- `productId` (number, requis): ID du produit

**Response:** (similaire à GET /api/orders)

---

### GET /api/orders/:id
Obtenir une commande par ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 5,
    "status": "CONFIRMED",
    "totalAmount": 179.98,
    "notes": "Livraison rapide SVP",
    "items": [...],
    "user": {...}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /api/orders
Créer une nouvelle commande.

**Body:**
```json
{
  "userId": 5,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 3,
      "quantity": 1,
      "price": 45.99
    }
  ],
  "notes": "Livraison rapide"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 157,
    "userId": 5,
    "status": "PENDING",
    "totalAmount": 225.97,
    "items": [...]
  },
  "message": "Order created successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /api/orders/calculate
Calculer le total d'une commande.

**Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subtotal": 179.98,
    "tax": 0,
    "total": 179.98
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /api/orders/:id/status
Mettre à jour le statut d'une commande.

**Body:**
```json
{
  "status": "CONFIRMED"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "CONFIRMED"
  },
  "message": "Order status updated successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /api/orders/:id/confirm
Confirmer une commande.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "CONFIRMED"
  },
  "message": "Order confirmed successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /api/orders/:id/cancel
Annuler une commande.

**Body:**
```json
{
  "reason": "Client a changé d'avis"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "CANCELLED"
  },
  "message": "Order cancelled successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /api/orders/:id/deliver
Marquer une commande comme livrée.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "DELIVERED"
  },
  "message": "Order marked as delivered",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### DELETE /api/orders/:id
Supprimer une commande.

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Order deleted successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 💬 Routes Messagerie

Base URL: `/api/messaging`

### GET /api/messaging
Liste tous les messages avec filtres et pagination.

**Query Parameters:**
- `page`, `limit` (pagination)
- `status` (string): DRAFT, SENT, DELIVERED, READ, FAILED, ARCHIVED
- `type` (string): EMAIL, SMS, PUSH, IN_APP, SYSTEM
- `priority` (string): LOW, NORMAL, HIGH, URGENT
- `userId` (number): Filtrer par utilisateur (envoyé ou reçu)
- `search` (string): Recherche dans sujet et corps
- `unreadOnly` (boolean): Afficher uniquement non lus
- `startDate`, `endDate` (dates)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "recipientId": 5,
      "senderId": 1,
      "subject": "Bienvenue",
      "body": "Bienvenue sur notre plateforme !",
      "type": "EMAIL",
      "priority": "NORMAL",
      "status": "DELIVERED",
      "readAt": null,
      "deliveredAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "sender": {
        "id": 1,
        "email": "admin@club.com",
        "firstName": "Admin",
        "lastName": "Club"
      },
      "recipient": {
        "id": 5,
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "pagination": {...},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/messaging/stats
Obtenir les statistiques des messages.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSent": 1523,
    "totalDelivered": 1498,
    "totalRead": 1245,
    "totalFailed": 25,
    "deliveryRate": 98.36,
    "readRate": 83.11,
    "messagesByType": {
      "EMAIL": 1200,
      "SMS": 200,
      "IN_APP": 100,
      "SYSTEM": 23
    },
    "messagesByStatus": {
      "SENT": 50,
      "DELIVERED": 253,
      "READ": 1195,
      "FAILED": 25
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/messaging/unread
Obtenir les messages non lus de l'utilisateur connecté.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "subject": "Nouveau cours disponible",
      "type": "IN_APP",
      "priority": "NORMAL",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "sender": {...}
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/messaging/unread/count
Compter les messages non lus.

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 8
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/messaging/sent
Obtenir les messages envoyés par l'utilisateur connecté.

**Response:** (similaire à GET /api/messaging)

---

### GET /api/messaging/received
Obtenir les messages reçus par l'utilisateur connecté.

**Response:** (similaire à GET /api/messaging)

---

### GET /api/messaging/conversation/:userId
Obtenir la conversation avec un utilisateur.

**Path Parameters:**
- `userId` (number, requis): ID de l'autre utilisateur

**Response:** (similaire à GET /api/messaging)

---

### GET /api/messaging/:id
Obtenir un message par ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "recipientId": 5,
    "senderId": 1,
    "subject": "Bienvenue",
    "body": "Bienvenue sur notre plateforme !",
    "type": "EMAIL",
    "priority": "NORMAL",
    "status": "DELIVERED",
    "sender": {...},
    "recipient": {...}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /api/messaging
Créer et envoyer un nouveau message.

**Body:**
```json
{
  "recipientId": 5,
  "subject": "Cours annulé",
  "body": "Le cours de demain est annulé.",
  "type": "EMAIL",
  "priority": "HIGH"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1524,
    "subject": "Cours annulé",
    "status": "SENT",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Message sent successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /api/messaging/bulk
Envoyer des messages en masse.

**Body:**
```json
{
  "recipientIds": [5, 6, 7, 8],
  "subject": "Rappel cours de demain",
  "body": "N'oubliez pas le cours de demain !",
  "type": "EMAIL",
  "priority": "NORMAL"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 4,
    "recipients": 4
  },
  "message": "Bulk messages sent to 4 recipients",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /api/messaging/:id/read
Marquer un message comme lu.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "READ",
    "readAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Message marked as read",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /api/messaging/read-many
Marquer plusieurs messages comme lus.

**Body:**
```json
{
  "messageIds": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  },
  "message": "5 messages marked as read",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /api/messaging/read-all
Marquer tous les messages comme lus.

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 8
  },
  "message": "8 messages marked as read",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /api/messaging/:id/archive
Archiver un message.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "ARCHIVED"
  },
  "message": "Message archived successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### DELETE /api/messaging/:id
Supprimer un message.

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Message deleted successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🔐 Authentification

Toutes les routes (sauf indication contraire) nécessitent un JWT token dans le header `Authorization`:

```
Authorization: Bearer <your-jwt-token>
```

## 🏢 Multi-tenant

Le tenant ID est extrait automatiquement de :
1. JWT token (recommandé)
2. Header `X-Tenant-ID`
3. Sous-domaine
4. Valeur par défaut

## 📝 Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## 🎯 Format des erreurs

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid product ID",
    "details": null,
    "field": "productId"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

**Version:** 1.0.0  
**Date:** 2024  
**Statut:** ✅ Production Ready