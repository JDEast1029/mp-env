// 第三方库
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MPWebpackPlugin = require('../plugin/mp-webpack-plugin');

// const
const APP_ROOT = process.cwd();

module.exports = {
	entry: './src/app.json',
	output: {
		path: path.resolve(APP_ROOT, 'dist'),
	},
	resolve: { 
		alias: {
			'@utils': path.resolve(APP_ROOT, 'src/utils'),
		}
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				use: [
					{
						loader: 'babel-loader'
					}
				]
			},
		]
	},
	plugins: [
		new MPWebpackPlugin(),
		new CopyPlugin([
			{ 
				from: './src', 
				to: './',
				// ignore: ['**/*.js']
			},
		]),
	],
	optimization: {
		// 原：CommonsChunkPlugin()
		splitChunks: {
			name: true,
			chunks: 'all',
			name: 'common',
		}
	}
};