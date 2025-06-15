import React, { useEffect, useState, useRef } from 'react';
import { Provider } from 'react-redux';
import store from '../../../redux/store';
import { Modal } from '../../../components/ui/modal';
import '../../styles/magasin-style.css';

interface TailleQuantitee {
  taille: string;
  quantitee: string;
}

const AjouterArticle = () => {
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [formData, setFormData] = useState<{
    nom: string;
    description: string;
    prix: string;
    image_url: string;
    categorie_id: string;
    tailles: TailleQuantitee[];
  }>({
    nom: '',
    description: '',
    prix: '',
    image_url: '',
    categorie_id: '',
    tailles: [{ taille: '', quantitee: '' }],
  });

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/magasin/articles/categories');
      const data = await response.json();

      if (response.ok) {
        const mappedCategories: Record<number, string> = {};
        data.forEach((cat: { id: number; nom: string }) => {
          mappedCategories[cat.id] = cat.nom;
        });
        setCategories(mappedCategories);
      } else {
        setError(data.message || 'Erreur inconnue');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTailleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
  
    // Type guard explicite pour rassurer TypeScript
    if (name === 'taille' || name === 'quantitee') {
      const updatedTailles = [...formData.tailles];
      updatedTailles[index] = {
        ...updatedTailles[index],
        [name]: value,
      };
      setFormData({ ...formData, tailles: updatedTailles });
    }
  };
  

  const ajouterTaille = () => {
    setFormData({ ...formData, tailles: [...formData.tailles, { taille: '', quantitee: '' }] });
  };

  const supprimerTaille = (index: number) => {
    const updatedTailles = formData.tailles.filter((_, i) => i !== index);
    setFormData({ ...formData, tailles: updatedTailles });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData((prevData) => ({
        ...prevData,
        image_url: imageUrl,
      }));
    }
  };

  const supprimerImage = () => {
    setFormData((prevData) => ({
      ...prevData,
      image_url: ''
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const dataToSend = {
      nom: formData.nom,
      description: formData.description,
      prix: parseFloat(formData.prix),
      image_url: formData.image_url,
      categorie_id: parseInt(formData.categorie_id),
      tailles: formData.tailles.map((t) => ({
        taille: t.taille,
        quantitee: parseInt(t.quantitee),
      })),
    };

    console.log(dataToSend)

    // try {
    //   const response = await fetch('http://localhost:3000/magasin/articles/ajouter', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(dataToSend),
    //   });

    //   const data = await response.json();

    //   if (response.ok) {
    //     setModalMessage(data.message);
    //     setShowModal(true);
    //     setFormData({
    //       nom: '',
    //       description: '',
    //       prix: '',
    //       image_url: '',
    //       categorie_id: '',
    //       tailles: [{ taille: '', quantitee: '' }],
    //     });
    //   } else {
    //     setError(data.message || 'Erreur inconnue');
    //   }
    // } catch (error) {
    //   setError('Erreur lors de l\'envoi du formulaire');
    // }
  };

  return (
    <Provider store={store}>
      <div className="ajouter-article">
        <h1>Ajouter un article</h1>

        {error && <p className="error-message">{error}</p>}
        {showModal && <p className="success-message">{modalMessage}</p>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="nom">Nom</label>
            <input type="text" id="nom" name="nom" value={formData.nom} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label htmlFor="prix">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Décris ton article ici..."
            ></textarea>
          </div>

          <div className="input-group">
            <label htmlFor="prix">Prix</label>
            <input
              type="number"
              id="prix"
              name="prix"
              value={formData.prix}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
            />
          </div>

          <div className="input-group">
  <label htmlFor="image">Image de l'article</label>
  <input
  type="file"
  id="image"
  name="image"
  accept="image/*"
  onChange={handleImageUpload}
  ref={fileInputRef}
  required
/>

  {/* Aperçu de l'image */}
  {formData.image_url && (
    <>
      <div className="image-preview">
        <img
          src={formData.image_url}
          alt="Aperçu"
          style={{ maxWidth: '200px', marginTop: '10px' }}
          onLoad={() => URL.revokeObjectURL(formData.image_url)}
        />
      </div>

      {/* Bouton séparé mais toujours affiché si image présente */}
        <button type="button" onClick={supprimerImage}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#5f6368"
          >
            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360Z" />
          </svg>
        </button>
    </>
  )}
</div>


          <div className="input-group">
            <label htmlFor="categorie_id">Catégorie</label>
            <select
              id="categorie_id"
              name="categorie_id"
              value={formData.categorie_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Sélectionnez une catégorie --</option>
              {Object.entries(categories).map(([id, nom]) => (
                <option key={id} value={id}>
                  {nom}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group-special">
  {formData.tailles.map((tailleData, index) => (
    <div key={index} className="taille-group">
      <label htmlFor={`taille-quantitee-${index}`}>Taille et quantité</label>
      <input
        type="text"
        id={`taille-quantitee-${index}`}
        name="taille"
        placeholder="Taille (ex: S, M, L)"
        value={tailleData.taille}
        onChange={(e) => handleTailleChange(index, e)}
        required
      />
      <input
        type="number"
        name="quantitee"
        placeholder="Quantité"
        value={tailleData.quantitee}
        onChange={(e) => handleTailleChange(index, e)}
        required
        min="0"
      />
      {formData.tailles.length > 1 && (
        <button type="button" onClick={() => supprimerTaille(index)}>
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/>
          </svg>
        </button>
      )}
    </div>
  ))}
  {/* Le bouton "+" est en dehors de la boucle */}
  <button type="button" onClick={ajouterTaille}>+</button>
</div>



          <button type="submit" onClick={handleSubmit}>Ajouter l'article</button>
        </form>
      </div>

      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        message={modalMessage}
        title="Notification"
      />
    </Provider>
  );
};

export default AjouterArticle;
