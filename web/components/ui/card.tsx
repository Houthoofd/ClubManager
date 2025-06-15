import React from "react";
import '../../app/styles/style-card.css';

interface ArticleCardProps {
  title: string;
  description: string;
  imageUrl: string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ title, description, imageUrl }) => {
  return (
    <div className="article-card">
      <div className="content-background">
        <div className="header-info-panel">
          <div className="new-article-card">
            <span>Nouveau</span>
          </div>
          <div className="icon-favorite">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z"/></svg>
          </div>
        </div>
        <img src={imageUrl} alt={title} className="article-image" />
      </div>
      <div className="content-description">
        <div className="content-panel-title">
          <h3 className="article-title">{title}</h3>
          <div className="icon-more-infos">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>
          </div>
        </div>
        <div className="content-panel-info">
          <div className="content-panel-info-price">
            <span>Prix :</span>
            <span>200 euros</span>
          </div>
          <div className="content-panel-icon-buy">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M440-600v-120H320v-80h120v-120h80v120h120v80H520v120h-80ZM280-80q-33 0-56.5-23.5T200-160q0-33 23.5-56.5T280-240q33 0 56.5 23.5T360-160q0 33-23.5 56.5T280-80Zm400 0q-33 0-56.5-23.5T600-160q0-33 23.5-56.5T680-240q33 0 56.5 23.5T760-160q0 33-23.5 56.5T680-80ZM40-800v-80h131l170 360h280l156-280h91L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68.5-39t-1.5-79l54-98-144-304H40Z"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
