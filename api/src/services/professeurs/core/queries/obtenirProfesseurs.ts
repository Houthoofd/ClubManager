/**
 * Requête pour obtenir tous les professeurs avec filtres et pagination
 */

export interface ObtenirProfesseursArgs {
  status_id?: number;
  grade_id?: number;
  genre_id?: number;
  recherche?: string;
  limit?: number;
  offset?: number;
}

export async function obtenirProfesseurs(prisma: any, args: ObtenirProfesseursArgs) {
  const {
    status_id,
    grade_id,
    genre_id,
    recherche,
    limit = 50,
    offset = 0
  } = args;

  const where: any = {
    status_id: 5 // Professeurs uniquement
  };

  if (grade_id) {
    where.grade_id = grade_id;
  }

  if (genre_id) {
    where.genre_id = genre_id;
  }

  if (recherche) {
    where.OR = [
      { nom: { contains: recherche } },
      { prenom: { contains: recherche } },
      { email: { contains: recherche } },
      { nom_utilisateur: { contains: recherche } }
    ];
  }

  const [professeurs, total] = await Promise.all([
    prisma.utilisateurs.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        nom_utilisateur: true,
        email: true,
        genre_id: true,
        date_naissance: true,
        grade_id: true,
        status_id: true
      },
      orderBy: {
        nom: 'asc'
      },
      take: limit,
      skip: offset
    }),
    prisma.utilisateurs.count({ where })
  ]);

  return {
    professeurs: professeurs.map((p: any) => ({
      id: p.id,
      nom: p.nom,
      prenom: p.prenom,
      nom_utilisateur: p.nom_utilisateur,
      email: p.email,
      genre_id: p.genre_id,
      date_naissance: p.date_naissance,
      grade_id: p.grade_id,
      status_id: p.status_id
    })),
    total,
    hasMore: offset + professeurs.length < total
  };
}
