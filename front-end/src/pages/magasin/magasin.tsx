import { Provider } from 'react-redux';
import store from '../../redux/store';
import {
  Gallery,
  GalleryItem,
  PageSection,
  PageSectionVariants,
  Title
} from '@patternfly/react-core';
import ArticleCard from '../../components/card';

const Magasin = () => {
  const articles = [
    {
      title: 'Chaussures de sport',
      description: 'Des chaussures légères et confortables pour vos entraînements.',
      imageUrl: 'http://localhost:3000/public/images/frederic.jpg'
    },
    {
      title: 'Kimono de Judo',
      description: 'Kimono résistant adapté pour les compétitions.',
      imageUrl: 'http://localhost:3000/public/images/judo.jpg'
    },
    {
      title: 'Gants de Boxe',
      description: 'Gants en cuir pour vos entraînements de boxe thaï.',
      imageUrl: 'http://localhost:3000/public/images/boxe.jpg'
    }
  ];

  return (
    <Provider store={store}>
      <PageSection variant="default">
        <Title headingLevel="h1">Magasin</Title>
      </PageSection>

      <PageSection>
        <Gallery hasGutter minWidths={{ default: '300px' }}>
          {articles.map((article, index) => (
            <GalleryItem key={index}>
              <ArticleCard
                title={article.title}
                description={article.description}
                imageUrl={article.imageUrl}
              />
            </GalleryItem>
          ))}
        </Gallery>
      </PageSection>
    </Provider>
  );
};

export default Magasin;
