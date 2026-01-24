/**
 * Mock local pour les tests du service Cours
 */

// Helper pour créer des fonctions mock sans dépendance à jest
const createMockFn = <T extends (...args: any[]) => any>(implementation: T) => {
  return implementation;
};

// Données mock - Professeurs
export const mockProfesseurs = [
  {
    id: 1,
    nom: 'Sensei',
    prenom: 'Karate',
    email: 'karate.sensei@test.com',
    phone: '0611111111',
    date_embauche: new Date('2020-01-01'),
    specialite: 'Karaté',
    status_id: 5,
  },
  {
    id: 2,
    nom: 'Master',
    prenom: 'Judo',
    email: 'judo.master@test.com',
    phone: '0622222222',
    date_embauche: new Date('2019-06-15'),
    specialite: 'Judo',
    status_id: 5,
  },
  {
    id: 3,
    nom: 'Coach',
    prenom: 'Taekwondo',
    email: 'taekwondo.coach@test.com',
    phone: '0633333333',
    date_embauche: new Date('2021-03-10'),
    specialite: 'Taekwondo',
    status_id: 5,
  },
];

// Données mock - Utilisateurs
export const mockUtilisateurs = [
  {
    id: 1,
    first_name: 'Jean',
    last_name: 'Dupont',
    nom_utilisateur: 'jdupont',
    email: 'jean@test.com',
    phone: '0612345678',
  },
  {
    id: 2,
    first_name: 'Marie',
    last_name: 'Martin',
    nom_utilisateur: 'mmartin',
    email: 'marie@test.com',
    phone: '0698765432',
  },
];

// Données mock - Cours récurrents
export const mockCoursRecurrent = [
  {
    id: 1,
    type_cours: 'Karaté Débutant',
    jour_semaine: 2, // Mardi
    heure_debut: '18:00',
    heure_fin: '19:30',
  },
  {
    id: 2,
    type_cours: 'Judo Avancé',
    jour_semaine: 4, // Jeudi
    heure_debut: '19:00',
    heure_fin: '20:30',
  },
  {
    id: 3,
    type_cours: 'Taekwondo Enfants',
    jour_semaine: 3, // Mercredi
    heure_debut: '14:00',
    heure_fin: '15:00',
  },
];

// Données mock - Relation cours récurrent - professeur
export const mockCoursRecurrentProfesseur = [
  { id: 1, cours_recurrent_id: 1, professeur_id: 1 },
  { id: 2, cours_recurrent_id: 2, professeur_id: 2 },
  { id: 3, cours_recurrent_id: 3, professeur_id: 3 },
];

// Données mock - Cours
export const mockCours = [
  {
    id: 1,
    date_cours: new Date('2026-01-28'), // Mardi prochain
    type_cours: 'Karaté Débutant',
    heure_debut: '18:00',
    heure_fin: '19:30',
    cours_recurrent_id: 1,
  },
  {
    id: 2,
    date_cours: new Date('2026-01-30'), // Jeudi prochain
    type_cours: 'Judo Avancé',
    heure_debut: '19:00',
    heure_fin: '20:30',
    cours_recurrent_id: 2,
  },
  {
    id: 3,
    date_cours: new Date('2026-01-29'), // Mercredi prochain
    type_cours: 'Taekwondo Enfants',
    heure_debut: '14:00',
    heure_fin: '15:00',
    cours_recurrent_id: 3,
  },
  {
    id: 4,
    date_cours: new Date('2026-02-04'), // Mardi suivant
    type_cours: 'Karaté Débutant',
    heure_debut: '18:00',
    heure_fin: '19:30',
    cours_recurrent_id: 1,
  },
];

// Données mock - Inscriptions
export const mockInscriptions = [
  {
    id: 1,
    cours_id: 1,
    utilisateur_id: 1,
    is_present: null,
    is_validate: null,
  },
  {
    id: 2,
    cours_id: 1,
    utilisateur_id: 2,
    is_present: true,
    is_validate: true,
  },
  {
    id: 3,
    cours_id: 2,
    utilisateur_id: 2,
    is_present: false,
    is_validate: false,
  },
];

// Factory pour créer un mock Prisma
export const createMockPrisma = () => {
  // Copie des données pour permettre la réinitialisation
  let professeurs = [...mockProfesseurs];
  let utilisateurs = [...mockUtilisateurs];
  let coursRecurrent = [...mockCoursRecurrent];
  let coursRecurrentProfesseur = [...mockCoursRecurrentProfesseur];
  let cours = [...mockCours];
  let inscriptions = [...mockInscriptions];

  return {
    cours: {
      findMany: createMockFn((args?: any) => {
        let results = [...cours];
        
        if (args?.where?.id) {
          results = results.filter(c => c.id === args.where.id);
        }
        if (args?.where?.cours_recurrent_id) {
          results = results.filter(c => c.cours_recurrent_id === args.where.cours_recurrent_id);
        }
        if (args?.where?.date_cours?.gte) {
          results = results.filter(c => c.date_cours >= args.where.date_cours.gte);
        }
        if (args?.where?.date_cours?.lte) {
          results = results.filter(c => c.date_cours <= args.where.date_cours.lte);
        }
        
        // Filtrer par inscriptions avec some
        if (args?.where?.inscriptions?.some) {
          const someCondition = args.where.inscriptions.some;
          results = results.filter(c => {
            return inscriptions.some(i => {
              if (i.cours_id !== c.id) return false;
              if (someCondition.utilisateur_id && i.utilisateur_id !== someCondition.utilisateur_id) return false;
              return true;
            });
          });
        }
        
        if (args?.orderBy?.date_cours) {
          results.sort((a, b) => {
            const dateA = new Date(a.date_cours).getTime();
            const dateB = new Date(b.date_cours).getTime();
            return args.orderBy.date_cours === 'asc' ? dateA - dateB : dateB - dateA;
          });
        }
        
        if (args?.take) {
          results = results.slice(0, args.take);
        }
        
        // Ajouter les inscriptions si demandées
        if (args?.include?.inscriptions) {
          results = results.map(c => ({
            ...c,
            inscriptions: inscriptions.filter(i => i.cours_id === c.id).map(i => {
              const insc: any = { ...i };
              if (args.include.inscriptions.include?.utilisateurs) {
                insc.utilisateurs = utilisateurs.find(u => u.id === i.utilisateur_id);
              }
              return insc;
            }),
          }));
        }
        
        return Promise.resolve(results);
      }),

      findUnique: createMockFn((args: any) => {
        const c = cours.find(c => c.id === args.where.id);
        return Promise.resolve(c || null);
      }),

      create: createMockFn((args: any) => {
        const newCours = {
          id: cours.length + 1,
          ...args.data,
        };
        cours.push(newCours);
        return Promise.resolve(newCours);
      }),

      update: createMockFn((args: any) => {
        const index = cours.findIndex(c => c.id === args.where.id);
        if (index === -1) return Promise.resolve(null);
        
        cours[index] = { ...cours[index], ...args.data };
        return Promise.resolve(cours[index]);
      }),

      delete: createMockFn((args: any) => {
        const index = cours.findIndex(c => c.id === args.where.id);
        if (index === -1) return Promise.resolve(null);
        
        const deleted = cours[index];
        cours.splice(index, 1);
        return Promise.resolve(deleted);
      }),

      createMany: createMockFn((args: any) => {
        const created = args.data.map((data: any) => {
          const newCours = {
            id: cours.length + 1,
            ...data,
          };
          cours.push(newCours);
          return newCours;
        });
        return Promise.resolve({ count: created.length });
      }),

      updateMany: createMockFn((args: any) => {
        let count = 0;
        cours.forEach((c, index) => {
          let matches = true;
          
          if (args?.where?.cours_recurrent_id && c.cours_recurrent_id !== args.where.cours_recurrent_id) {
            matches = false;
          }
          
          if (matches) {
            cours[index] = { ...c, ...args.data };
            count++;
          }
        });
        
        return Promise.resolve({ count });
      }),

      deleteMany: createMockFn((args?: any) => {
        let count = 0;
        
        if (args?.where?.cours_recurrent_id) {
          const filtered = cours.filter(c => c.cours_recurrent_id !== args.where.cours_recurrent_id);
          count = cours.length - filtered.length;
          cours.length = 0;
          cours.push(...filtered);
        }
        
        return Promise.resolve({ count });
      }),
    },

    inscriptions: {
      findMany: createMockFn((args?: any) => {
        let results = [...inscriptions];
        
        if (args?.where?.utilisateur_id) {
          results = results.filter(i => i.utilisateur_id === args.where.utilisateur_id);
        }
        if (args?.where?.cours_id) {
          results = results.filter(i => i.cours_id === args.where.cours_id);
        }
        
        // Ajouter les relations si demandées
        if (args?.include) {
          results = results.map(i => {
            const result: any = { ...i };
            if (args.include.cours) {
              result.cours = cours.find(c => c.id === i.cours_id);
            }
            if (args.include.utilisateurs) {
              result.utilisateurs = utilisateurs.find(u => u.id === i.utilisateur_id);
            }
            return result;
          });
        }
        
        return Promise.resolve(results);
      }),

      create: createMockFn((args: any) => {
        const newInscription = {
          id: inscriptions.length + 1,
          ...args.data,
          is_present: null,
          is_validate: null,
        };
        inscriptions.push(newInscription);
        return Promise.resolve(newInscription);
      }),

      update: createMockFn((args: any) => {
        const index = inscriptions.findIndex(i => i.id === args.where.id);
        if (index === -1) return Promise.resolve(null);
        
        inscriptions[index] = { ...inscriptions[index], ...args.data };
        return Promise.resolve(inscriptions[index]);
      }),

      delete: createMockFn((args: any) => {
        const index = inscriptions.findIndex(i => i.id === args.where.id);
        if (index === -1) return Promise.resolve(null);
        
        const deleted = inscriptions[index];
        inscriptions.splice(index, 1);
        return Promise.resolve(deleted);
      }),

      findFirst: createMockFn((args: any) => {
        let results = [...inscriptions];
        
        if (args?.where?.cours_id) {
          results = results.filter(i => i.cours_id === args.where.cours_id);
        }
        if (args?.where?.utilisateur_id) {
          results = results.filter(i => i.utilisateur_id === args.where.utilisateur_id);
        }
        
        const inscription = results[0];
        if (!inscription) return Promise.resolve(null);
        
        // Ajouter les relations si demandées
        if (args?.include) {
          const result: any = { ...inscription };
          if (args.include.cours) {
            result.cours = cours.find(c => c.id === inscription.cours_id);
          }
          if (args.include.utilisateurs) {
            result.utilisateurs = utilisateurs.find(u => u.id === inscription.utilisateur_id);
          }
          return Promise.resolve(result);
        }
        
        return Promise.resolve(inscription);
      }),

      updateMany: createMockFn((args: any) => {
        let count = 0;
        inscriptions.forEach((inscription, index) => {
          let matches = true;
          
          if (args?.where?.cours_id && inscription.cours_id !== args.where.cours_id) {
            matches = false;
          }
          if (args?.where?.utilisateur_id && inscription.utilisateur_id !== args.where.utilisateur_id) {
            matches = false;
          }
          
          if (matches) {
            inscriptions[index] = { ...inscription, ...args.data };
            count++;
          }
        });
        
        return Promise.resolve({ count });
      }),

      deleteMany: createMockFn((args?: any) => {
        let count = 0;
        
        if (args?.where) {
          const filtered = inscriptions.filter(i => {
            if (args.where.cours_id && i.cours_id === args.where.cours_id) {
              return false;
            }
            if (args.where.utilisateur_id && i.utilisateur_id === args.where.utilisateur_id) {
              return false;
            }
            return true;
          });
          count = inscriptions.length - filtered.length;
          inscriptions.length = 0;
          inscriptions.push(...filtered);
        }
        
        return Promise.resolve({ count });
      }),

      count: createMockFn((args?: any) => {
        let results = [...inscriptions];
        
        if (args?.where?.cours_id) {
          results = results.filter(i => i.cours_id === args.where.cours_id);
        }
        
        return Promise.resolve(results.length);
      }),
    },

    cours_recurrent: {
      findMany: createMockFn((args?: any) => {
        let results = [...coursRecurrent];
        
        if (args?.where?.id) {
          results = results.filter(cr => cr.id === args.where.id);
        }
        if (args?.where?.jour_semaine) {
          results = results.filter(cr => cr.jour_semaine === args.where.jour_semaine);
        }
        
        // Ajouter les relations si demandées
        if (args?.include?.cours_recurrent_professeur) {
          results = results.map(cr => {
            const relations = coursRecurrentProfesseur.filter(crp => crp.cours_recurrent_id === cr.id);
            const relationsWithProf = relations.map(rel => ({
              ...rel,
              professeurs: professeurs.find(p => p.id === rel.professeur_id),
            }));
            return {
              ...cr,
              cours_recurrent_professeur: relationsWithProf,
            };
          });
        }
        
        return Promise.resolve(results);
      }),

      findUnique: createMockFn((args: any) => {
        const cr = coursRecurrent.find(cr => cr.id === args.where.id);
        return Promise.resolve(cr || null);
      }),

      findFirst: createMockFn((args: any) => {
        let results = [...coursRecurrent];
        
        if (args?.where?.jour_semaine) {
          results = results.filter(cr => cr.jour_semaine === args.where.jour_semaine);
        }
        if (args?.where?.type_cours) {
          results = results.filter(cr => cr.type_cours === args.where.type_cours);
        }
        if (args?.where?.heure_debut) {
          results = results.filter(cr => cr.heure_debut === args.where.heure_debut);
        }
        if (args?.where?.heure_fin) {
          results = results.filter(cr => cr.heure_fin === args.where.heure_fin);
        }
        
        return Promise.resolve(results[0] || null);
      }),

      create: createMockFn((args: any) => {
        const newCoursRecurrent = {
          id: coursRecurrent.length + 1,
          ...args.data,
        };
        coursRecurrent.push(newCoursRecurrent);
        return Promise.resolve(newCoursRecurrent);
      }),

      update: createMockFn((args: any) => {
        const index = coursRecurrent.findIndex(cr => cr.id === args.where.id);
        if (index === -1) return Promise.resolve(null);
        
        coursRecurrent[index] = { ...coursRecurrent[index], ...args.data };
        return Promise.resolve(coursRecurrent[index]);
      }),

      delete: createMockFn((args: any) => {
        const index = coursRecurrent.findIndex(cr => cr.id === args.where.id);
        if (index === -1) return Promise.resolve(null);
        
        const deleted = coursRecurrent[index];
        coursRecurrent.splice(index, 1);
        return Promise.resolve(deleted);
      }),
    },

    professeurs: {
      findMany: createMockFn(() => Promise.resolve([...professeurs])),
      
      findUnique: createMockFn((args: any) => {
        const prof = professeurs.find(p => p.id === args.where.id);
        return Promise.resolve(prof || null);
      }),
    },

    cours_recurrent_professeur: {
      findMany: createMockFn((args?: any) => {
        let results = [...coursRecurrentProfesseur];
        
        if (args?.where?.cours_recurrent_id) {
          results = results.filter(crp => crp.cours_recurrent_id === args.where.cours_recurrent_id);
        }
        if (args?.where?.professeur_id) {
          results = results.filter(crp => crp.professeur_id === args.where.professeur_id);
        }
        
        return Promise.resolve(results);
      }),

      create: createMockFn((args: any) => {
        const newRelation = {
          id: coursRecurrentProfesseur.length + 1,
          ...args.data,
        };
        coursRecurrentProfesseur.push(newRelation);
        return Promise.resolve(newRelation);
      }),

      deleteMany: createMockFn((args?: any) => {
        let count = 0;
        
        if (args?.where?.cours_recurrent_id) {
          const filtered = coursRecurrentProfesseur.filter(crp => 
            crp.cours_recurrent_id !== args.where.cours_recurrent_id
          );
          count = coursRecurrentProfesseur.length - filtered.length;
          coursRecurrentProfesseur.length = 0;
          coursRecurrentProfesseur.push(...filtered);
        }
        
        return Promise.resolve({ count });
      }),
    },

    utilisateurs: {
      findMany: createMockFn(() => Promise.resolve([...utilisateurs])),
      
      findUnique: createMockFn((args: any) => {
        const user = utilisateurs.find(u => u.id === args.where.id);
        return Promise.resolve(user || null);
      }),
    },

    // Méthode pour réinitialiser les données entre les tests
    _reset: () => {
      professeurs = [...mockProfesseurs];
      utilisateurs = [...mockUtilisateurs];
      coursRecurrent = [...mockCoursRecurrent];
      coursRecurrentProfesseur = [...mockCoursRecurrentProfesseur];
      cours = [...mockCours];
      inscriptions = [...mockInscriptions];
    },
  };
};
