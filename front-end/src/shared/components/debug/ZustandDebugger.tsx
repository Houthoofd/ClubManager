import React, { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

const ZustandDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Récupérer tous les états Zustand
  const cartItems = useCartStore((state) => state.items);
  const isCartOpen = useCartStore((state) => state.isOpen);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalItems = useCartStore((state) => state.getTotalItems);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const notifications = useUIStore((state) => state.notifications);

  const handleDebugCart = () => {
    console.log("🛒 [Zustand Debug] Cart State:", {
      items: cartItems,
      isOpen: isCartOpen,
      totalPrice: getTotalPrice(),
      totalItems: getTotalItems(),
    });
  };

  const handleDebugAuth = () => {
    console.log("👤 [Zustand Debug] Auth State:", {
      user,
      token: token ? "***" + token.slice(-8) : null,
      isAuthenticated,
    });
  };

  const handleDebugAll = () => {
    console.log("🔍 [Zustand Debug] ALL STORES:");
    handleDebugCart();
    handleDebugAuth();
    console.log("🔔 [Zustand Debug] UI State:", { notifications });
    console.log("💾 [Zustand Debug] LocalStorage:", {
      "cart-storage": localStorage.getItem("cart-storage"),
      "auth-storage": localStorage.getItem("auth-storage"),
      "ui-storage": localStorage.getItem("ui-storage"),
    });
  };

  if (import.meta.env.PROD) {
    return null; // Ne pas afficher en production
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "12px",
        maxWidth: "420px",
        maxHeight: "85vh",
        overflow: "auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        border: "2px solid #00d4ff",
      }}
    >
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "none",
          padding: "8px 14px",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "12px",
          width: "100%",
          fontWeight: "bold",
          fontSize: "13px",
        }}
      >
        🔍 Zustand Debug {isVisible ? "🔽" : "🔼"}
      </button>

      {isVisible && (
        <div>
          {/* Cart Section */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#00d4ff", fontSize: "14px" }}>
              🛒 Panier (Zustand)
            </h4>
            <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
              <div>
                <strong>État:</strong> {isCartOpen ? "✅ Ouvert" : "❌ Fermé"}
              </div>
              <div>
                <strong>Nombre d'articles:</strong> {getTotalItems()}
              </div>
              <div>
                <strong>Total:</strong> {getTotalPrice().toFixed(2)} €
              </div>
            </div>

            <button
              onClick={handleDebugCart}
              style={{
                background: "#28a745",
                color: "white",
                border: "none",
                padding: "4px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                marginTop: "8px",
              }}
            >
              🖨️ Log Panier
            </button>

            <div style={{ marginTop: "12px", maxHeight: "220px", overflow: "auto" }}>
              <strong style={{ color: "#00d4ff" }}>Articles:</strong>
              {cartItems.length === 0 ? (
                <div style={{ color: "#ffc107", marginTop: "6px" }}>Panier vide</div>
              ) : (
                <div style={{ marginTop: "6px" }}>
                  {cartItems.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        background: "rgba(102, 126, 234, 0.15)",
                        margin: "6px 0",
                        padding: "10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        border: "1px solid rgba(102, 126, 234, 0.3)",
                      }}
                    >
                      <div style={{ fontWeight: "bold", color: "#00d4ff" }}>
                        [{index}] {item.productName}
                      </div>
                      <div style={{ marginTop: "4px", opacity: 0.9 }}>
                        <span style={{ color: "#ffd700" }}>ID:</span> {item.id}
                      </div>
                      <div>
                        <span style={{ color: "#ffd700" }}>Prix:</span> {item.price.toFixed(2)}€ × {item.quantity} = {(item.price * item.quantity).toFixed(2)}€
                      </div>
                      {item.size && (
                        <div>
                          <span style={{ color: "#ffd700" }}>Taille:</span> {item.size}
                        </div>
                      )}
                      {item.stockId && (
                        <div>
                          <span style={{ color: "#ffd700" }}>Stock ID:</span> {item.stockId}
                        </div>
                      )}
                      {item.maxQuantity && (
                        <div>
                          <span style={{ color: "#ffd700" }}>Dispo:</span> {item.maxQuantity}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Auth Section */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#00d4ff", fontSize: "14px" }}>
              👤 Auth (Zustand)
            </h4>
            <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
              <div>
                <strong>Connecté:</strong> {isAuthenticated ? "✅ Oui" : "❌ Non"}
              </div>
              <div>
                <strong>Utilisateur:</strong>{" "}
                {user?.first_name || user?.last_name
                  ? `${user?.first_name} ${user?.last_name}`
                  : "Non connecté"}
              </div>
              {user && (
                <>
                  <div>
                    <strong>ID:</strong> {user.id}
                  </div>
                  <div>
                    <strong>Email:</strong> {user.email}
                  </div>
                  <div>
                    <strong>Rôle:</strong> {user.role}
                  </div>
                </>
              )}
              <div>
                <strong>Token:</strong> {token ? "✅ Présent" : "❌ Absent"}
              </div>
            </div>

            <button
              onClick={handleDebugAuth}
              style={{
                background: "#17a2b8",
                color: "white",
                border: "none",
                padding: "4px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                marginTop: "8px",
              }}
            >
              🖨️ Log Auth
            </button>
          </div>

          {/* UI Section */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#00d4ff", fontSize: "14px" }}>
              🔔 UI (Zustand)
            </h4>
            <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
              <div>
                <strong>Notifications:</strong> {notifications.length}
              </div>
            </div>
          </div>

          {/* LocalStorage Section */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#00d4ff", fontSize: "14px" }}>
              💾 LocalStorage
            </h4>
            <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
              <div>
                <strong>cart-storage:</strong>{" "}
                {localStorage.getItem("cart-storage") ? "✅" : "❌"}
              </div>
              <div>
                <strong>auth-storage:</strong>{" "}
                {localStorage.getItem("auth-storage") ? "✅" : "❌"}
              </div>
              <div>
                <strong>ui-storage:</strong>{" "}
                {localStorage.getItem("ui-storage") ? "✅" : "❌"}
              </div>
            </div>

            <button
              onClick={handleDebugAll}
              style={{
                background: "#dc3545",
                color: "white",
                border: "none",
                padding: "4px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                marginTop: "8px",
              }}
            >
              🖨️ Log Everything
            </button>
          </div>

          {/* Info Footer */}
          <div
            style={{
              fontSize: "10px",
              color: "#888",
              marginTop: "12px",
              paddingTop: "8px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            💡 Utilisez <code>window.__STORES__</code> dans la console pour accéder aux stores
          </div>
        </div>
      )}
    </div>
  );
};

export default ZustandDebugger;
