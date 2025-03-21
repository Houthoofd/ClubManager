const path = require('path');

module.exports = {
  entry: './app/index.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {

      // Ajoute d'autres alias selon ton besoin
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules\/(?!(@react-native|expo|react-navigation|expo-router)\/).*/,
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'assets/resource',
        exclude: /node_modules/, // Exclusion pour éviter les conflits avec les modules spécifiques
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource',
        include: /node_modules\/(@react-navigation|expo-router)\/.*/, // Inclure spécifiquement ces modules pour le traitement des images
      },
      {
        test: /\.css$/,  // Pour tous les fichiers CSS
        use: ['style-loader', 'css-loader'],  // Charge les styles
      },
    ],
  },
  mode: 'development',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),  // Dossier où le bundle sera servi
    compress: true,  // Active la compression des fichiers
    port: 9000,  // Port du serveur (par défaut, il est 8080)
    hot: true,  // Active le rechargement à chaud des modules
    open: true,  // Ouvre automatiquement le navigateur par défaut
    historyApiFallback: true,  // Permet de rediriger les requêtes vers index.html (utile pour les routes SPA)
  },
};

