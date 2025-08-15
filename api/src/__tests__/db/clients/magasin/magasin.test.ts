import { jest } from "@jest/globals";
import { Magasin } from "../../../../db/clients/magasin/magasin.js";
import MysqlConnector from "../../../../db/connector/mysqlconnector.js";

// Mock MySQL Connector
jest.mock("../../../../db/connector/mysqlconnector.js");

describe("Magasin Client avec MySQL", () => {
  let magasin: Magasin;
  let mockMysqlConnector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    magasin = new Magasin();
    mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];

    // Mock transaction methods sur le prototype
    MysqlConnector.prototype.beginTransaction = jest.fn((cb: Function) => cb(null));
    MysqlConnector.prototype.commit = jest.fn((cb: Function) => cb(null));
    MysqlConnector.prototype.rollback = jest.fn((cb: Function) => cb());
  });

  test("obtenirArticlesParCategories retourne les articles par catégorie", async () => {
    const mockResults = [
      { id: 1, nom: "Kimono", prix: 50, description: "desc", categorie_id: 2, categorie_nom: "Vêtements", image_url: "img1.jpg", stock_taille: "M", stock_quantite: 10 },
      { id: 2, nom: "Ceinture", prix: 10, description: "desc", categorie_id: 1, categorie_nom: "Équipement", image_url: "img2.jpg", stock_taille: "S", stock_quantite: 5 }
    ];

    mockMysqlConnector.query.mockImplementationOnce((_sql: string, _values: any[], callback: Function) =>
      callback(null, mockResults)
    );

    const expected = {
      "Vêtements": [
        {
          id: 1,
          nom: "Kimono",
          prix: 50,
          description: "desc",
          images: ["img1.jpg"],
          stocks: [{ taille: "M", quantite: 10 }],
          categorie_id: 2
        }
      ],
      "Équipement": [
        {
          id: 2,
          nom: "Ceinture",
          prix: 10,
          description: "desc",
          images: ["img2.jpg"],
          stocks: [{ taille: "S", quantite: 5 }],
          categorie_id: 1
        }
      ]
    };

    const result = await magasin.obtenirArticlesParCategories();
    expect(result).toEqual(expected);
    expect(mockMysqlConnector.query).toHaveBeenCalledTimes(1);
  });

  test("obtenirArticlesParCategories gère les erreurs de DB", async () => {
    const dbError = new Error("Database error");
    mockMysqlConnector.query.mockImplementationOnce((_sql: string, _values: any[], callback: Function) =>
      callback(dbError)
    );

    await expect(magasin.obtenirArticlesParCategories()).rejects.toThrow("Database error");
  });

  test("obtenirLesCategories retourne toutes les catégories", async () => {
    const mockCategories = [{ id: 1, nom: "Vêtements" }];
    mockMysqlConnector.query.mockImplementationOnce((_sql: string, _values: any[], callback: Function) =>
      callback(null, mockCategories)
    );

    const result = await magasin.obtenirLesCategories();
    expect(result).toEqual(mockCategories);
    expect(mockMysqlConnector.query).toHaveBeenCalledWith(
      "SELECT * FROM categories",
      [],
      expect.any(Function)
    );
  });

  test("ajouterArticle insère un article avec succès", async () => {
    mockMysqlConnector.query
      .mockImplementationOnce((_sql: string, _values: any[], callback: Function) => callback(null, { insertId: 1 })) // insert article
      .mockImplementationOnce((_sql: string, _values: any[], callback: Function) => callback(null)) // insert images
      .mockImplementationOnce((_sql: string, _values: any[], callback: Function) => callback(null)); // insert stocks

    magasin.getTailleMap = () => Promise.resolve({ "M": 1 });

    const articleData = {
      nom: "T-shirt",
      prix: 25.99,
      description: "T-shirt du club",
      categorie_id: 1,
      images: ["img.jpg"],
      stocks: [{ taille: "M", quantite: 10 }]
    };
    const result = await magasin.ajouterArticle(articleData);

    expect(result).toMatchObject({ isConfirm: true });
    expect(mockMysqlConnector.query).toHaveBeenCalledTimes(3);
  });

  test("creerCommande insère une commande avec succès", async () => {
    magasin = new Magasin();
    mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];

    // Mock des transactions
    jest.spyOn(MysqlConnector.prototype, 'beginTransaction')
      .mockImplementation((cb: Function) => cb(null));
    jest.spyOn(MysqlConnector.prototype, 'commit')
      .mockImplementation((cb: Function) => cb(null));

    // Typage explicite pour les paramètres du mock
    mockMysqlConnector.query
      .mockImplementationOnce((_sql: string, _values: any[], cb: Function) => cb(null, { insertId: 1 }))
      .mockImplementationOnce((_sql: string, _values: any[], cb: Function) => cb(null));

    magasin.getTailleMap = () => Promise.resolve({ "M": 1 });

    const utilisateur_id = 1;
    const articles = [{ article_id: 1, quantite: 2, prix: 25.99, taille: "M" } as any];
    const total = 51.98;
    const date = new Date().toISOString();

    const result = await magasin.creerCommande(utilisateur_id, articles, total, date);

    expect(result).toMatchObject({ isConfirm: true });
    expect(mockMysqlConnector.query).toHaveBeenCalledTimes(2);
  });



  test("supprimerArticle supprime un article avec succès", async () => {
    mockMysqlConnector.query.mockImplementationOnce((_sql: string, _values: any[], callback: Function) =>
      callback(null, { affectedRows: 1 })
    );

    const result = await magasin.supprimerArticle(1);
    expect(result).toMatchObject({ isConfirm: true });
    expect(mockMysqlConnector.query).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM articles"),
      [1],
      expect.any(Function)
    );
  });

  test("modifierArticle met à jour un article avec succès", async () => {
    mockMysqlConnector.query
      .mockImplementationOnce((_sql: string, _values: any[], callback: Function) => callback(null, { affectedRows: 1 })) // update article
      .mockImplementationOnce((_sql: string, _values: any[], callback: Function) => callback(null)) // delete images
      .mockImplementationOnce((_sql: string, _values: any[], callback: Function) => callback(null)); // insert images

    const updateData = {
      id: 1,
      nom: "Kimono Pro",
      prix: 60,
      description: "Desc",
      categorie_id: 1,
      images: ["img.jpg"],
      stocks: [{ taille: "M", quantite: 5 }]
    };
    const result = await magasin.modifierArticle(1, updateData);

    expect(result).toMatchObject({ isConfirm: true });
    expect(mockMysqlConnector.query).toHaveBeenCalledTimes(3);
  });
});
