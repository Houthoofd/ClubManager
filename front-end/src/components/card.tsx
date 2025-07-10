import React, { useState } from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  Button,
  Modal,
  FormSelect,
  FormSelectOption
} from '@patternfly/react-core';

type Stock = {
  taille: string;
  quantite: number;
};

type ArticleCardProps = {
  title: string;
  description: string;
  imageUrl: string;
  prix: number;
  stocks: Stock[];
  onAddToCart: (taille: string) => void;
};

const ArticleCard: React.FC<ArticleCardProps> = ({
  title,
  description,
  imageUrl,
  prix,
  stocks,
  onAddToCart
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');

  const handleAddToCart = () => {
    if (selectedSize) {
      onAddToCart(selectedSize);
      setIsModalOpen(false);
      setSelectedSize('');
    }
  };

  const onChange = (_event: React.FormEvent<HTMLSelectElement>, value: string) => {
    setSelectedSize(value);
  };

  return (
    <>
      <Card style={{ height: '100%' }}>
        <img
          src={imageUrl}
          alt={title}
          style={{ width: '100%', height: '200px', objectFit: 'cover' }}
        />
        <CardTitle>{title}</CardTitle>
        <CardBody>
          <div className="pf-v5-c-content">
            <p>{description.slice(0, 100)}...</p>
            <p><strong>{prix} €</strong></p>
          </div>
        </CardBody>
        <CardFooter>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Plus d'informations
          </Button>
        </CardFooter>
      </Card>

      <Modal
  title="Choisir une taille"
  variant="large"
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
>
  {/* Contenu du modal */}
  <img
    src={imageUrl}
    alt={title}
    style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', marginBottom: '1rem' }}
  />
  <div className="pf-v5-c-content">
    <h2>{title}</h2>
    <p>{description}</p>
    <p><strong>Prix : {prix} €</strong></p>
  </div>

  <div style={{ marginTop: '1rem' }}>
    <p>Veuillez choisir une taille :</p>
    <FormSelect value={selectedSize} onChange={onChange} aria-label="Choix de la taille">
      <FormSelectOption key="placeholder" value="" label="Sélectionnez une taille" isDisabled />
      {stocks.map((stock) => (
        <FormSelectOption
          key={stock.taille}
          value={stock.taille}
          label={`${stock.taille}${stock.quantite === 0 ? ' (Rupture de stock)' : ''}`}
          isDisabled={stock.quantite === 0}
        />
      ))}
    </FormSelect>
  </div>

  {/* Actions */}
  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
    <Button variant="primary" onClick={handleAddToCart} isDisabled={!selectedSize}>
      Ajouter au panier
    </Button>
  </div>
</Modal>

    </>
  );
};

export default ArticleCard;
