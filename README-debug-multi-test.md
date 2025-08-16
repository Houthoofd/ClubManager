# Astuce pour déboguer Jest sur plusieurs fichiers

Pour isoler le problème :

1. Lancez vos tests sur plusieurs fichiers (ex : informations.test.ts, compte.test.ts, etc.).
2. Si l’erreur "does not provide an export named 'datannulationSchema'" n’apparaît que sur `cours.test.ts`, le souci vient du mock ou de l'import spécifique à ce fichier.
3. Si l’erreur apparaît sur plusieurs fichiers, le problème est global (build, mapping Jest, ou configuration ESM).
4. Comparez la structure des imports et des mocks entre les fichiers qui passent et ceux qui échouent.
5. Adaptez la stratégie de mock :  
   - Pour ESM, privilégiez `jest.unstable_mockModule` + import dynamique.
   - Pour CJS, utilisez `jest.mock` classique.

Cela vous aidera à cibler la source exacte du problème Jest/ESM.
