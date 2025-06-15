import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  Button
} from '@patternfly/react-core';

interface Props {
  title: string;
  description: string;
  imageUrl: string;
}

const ArticleCard: React.FC<Props> = ({ title, description, imageUrl }) => {
  return (
    <Card isHoverable isCompact style={{ width: '100%', height: '100%' }}>
      <CardHeader>
        <img src={imageUrl} alt={title} style={{ width: '100%', objectFit: 'cover' }} />
      </CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardBody>{description}</CardBody>
      <CardFooter>
        <Button variant="primary">Ajouter au panier</Button>
      </CardFooter>
    </Card>
  );
};

export default ArticleCard;
