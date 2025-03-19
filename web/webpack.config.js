const path = require('path');

module.exports = {
  entry: './app/index.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
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
};

