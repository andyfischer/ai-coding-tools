const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'electron-main',
  mode: process.env.NODE_ENV || 'development',
  entry: {
    main: './src/main/main.ts',
    preload: './src/main/preload.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.main.json',
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  externals: [nodeExternals()],
  node: {
    __dirname: false,
    __filename: false,
  },
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
};