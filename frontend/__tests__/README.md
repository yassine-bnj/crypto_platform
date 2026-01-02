# Tests Frontend - crypto_platform

## Tests implémentés

### 1. Tests du service API
**Fichier**: `__tests__/lib/api-service.test.ts`

- Authentication (token dans headers)
- GET requests (success, 404, network errors)
- POST requests (success, validation errors)
- Price history endpoint
- Heatmap endpoint

**Total**: ~15 tests

---

### 2. Tests des Hooks
**Fichier**: `__tests__/hooks/use-toast.test.ts`

- Ajout de toast
- Dismissal de toast
- Multiple toasts
- Variants (default, destructive)

**Total**: 6 tests

---

### 3. Tests du Context d'authentification
**Fichier**: `__tests__/context/auth.test.tsx`

- Initialisation sans utilisateur
- Login réussi
- Gestion d'erreurs de login
- Logout
- Register
- Restoration du token au mount

**Total**: 6 tests

---

### 4. Tests des composants UI
**Fichier**: `__tests__/components/ui.test.tsx`

- Button (render, click, variants, disabled)
- Card (structure, content)
- Badge (variants)

**Total**: 8 tests

---

## Configuration

### Dépendances installées
```json
{
  "@testing-library/jest-dom": "^6.1.5",
  "@testing-library/react": "^14.1.2",
  "@testing-library/user-event": "^14.5.1",
  "@types/jest": "^29.5.11",
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^29.7.0"
}
```

### Fichiers de configuration
- `jest.config.js`: Configuration Jest avec Next.js
- `jest.setup.js`: Setup global (jest-dom)

---

## Commandes

Exécuter tous les tests:
```bash
pnpm test
```

Watch mode (développement):
```bash
pnpm test:watch
```

Coverage report:
```bash
pnpm test:coverage
```

---

## Couverture

- ✅ API Service (fetch, auth, erreurs)
- ✅ Hooks (toast)
- ✅ Context (authentification complète)
- ✅ Composants UI de base

---

