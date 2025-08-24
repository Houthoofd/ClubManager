export async function fetchInformationsUtilisateur(prenom: string, nom: string): Promise<any> {
  const response = await fetch('/api/compte/informations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prenom, nom }),
  });
  return await response.json();
}
