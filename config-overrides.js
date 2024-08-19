const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = function override(config, env) {

  if (env === 'production') {
    // Add MiniCssExtractPlugin for extracting CSS into separate files
    config.plugins.push(
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].css',
        chunkFilename: 'static/css/[id].css',
      })
    );

    // Configure rules for handling CSS
    const cssRuleIndex = config.module.rules.findIndex(
      (rule) => rule.test && rule.test.toString() === '/\\.css$/'
    );

    if (cssRuleIndex !== -1) {
      const cssRule = config.module.rules[cssRuleIndex];
      config.module.rules[cssRuleIndex] = {
        oneOf: [
          {
            test: /\.module\.css$/,
            use: [
              MiniCssExtractPlugin.loader,
              {
                loader: 'css-loader',
                options: {
                  modules: true,
                },
              },
            ],
          },
          {
            use: [MiniCssExtractPlugin.loader, 'css-loader'],
          },
        ],
      };
    }

    // Configure rules for handling JS and JSX files
    const jsRule = config.module.rules.find((rule) =>
      'test' in rule ? rule.test.toString().includes('jsx?') : false
    );

    if (jsRule) {
      jsRule.exclude = /node_modules/;
      jsRule.use[0].options.plugins.push([
        require.resolve('babel-plugin-named-asset-import'),
        {
          loaderMap: {
            svg: {
              ReactComponent: '@svgr/webpack?-svgo,+titleProp,+ref![path]',
            },
          },
        },
      ]);
    }

    // Configure TerserPlugin for JavaScript optimization
    config.optimization.minimizer = [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log statements
          },
          output: {
            comments: false, // Remove comments
          },
        },
        extractComments: false, // Don't extract comments to a separate file
      }),
    ];

    config.optimization.splitChunks = {
      chunks: 'all',
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      name: false,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    };

    config.plugins.push(new CompressionPlugin());

    // Configure rules for handling images
    // config.module.rules.push({
    //   test: /\.(png|jpe?g|gif|svg)$/i,
    //   use: [
    //     {
    //       loader: 'file-loader',
    //       options: {
    //         name: '[name].[ext]',
    //         outputPath: 'static/images/[name].[ext]', // Output path for images
    //       },
    //     },
    //     {
    //       loader: 'image-webpack-loader',
    //       options: {
    //         disable: process.env.NODE_ENV !== 'production',
    //       },
    //     },
    //   ],
    // });
  }


  return config;
};
