// 第三方库
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MPWebpackPlugin = require('../plugin/mp-webpack-plugin');

// const
const APP_ROOT = process.cwd();

module.exports = {
	entry: './src/app.js',
	output: {
		path: path.resolve(APP_ROOT, 'dist'),
	},
	resolve: { 
		modules: [path.resolve(APP_ROOT, 'src')],
		extensions: [".js", ".json", "wxml", "wxss", ".scss"], // 自动解析某些扩展,能够使用户在引入模块时不带扩展
		alias: {
			'@utils': path.resolve(APP_ROOT, 'src/utils'),
			'@components': path.resolve(APP_ROOT, 'src/components'),
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
			{
				test: /\.(wxml|wxss)$/,
				use: ['file-loader'],
			},
			{
				test: /\.json$/,
				use: [
					{
						loader: path.resolve('plugin/alias-loader.js'),
						options: {
							test: 1
						}
					}
				]
			}
		]
	},
	plugins: [
		new MPWebpackPlugin(),
		new CopyPlugin([
			{ 
				from: './src', 
				to: './',
				ignore: ['**/.DS_Store', '**/*.md']
			},
		]),
	],
	optimization: {
		minimize: false, // 正式时开启压缩
		// 原：CommonsChunkPlugin()
		splitChunks: {
			name: true,
			chunks: 'all',
			name: 'common',
		}
	}
};