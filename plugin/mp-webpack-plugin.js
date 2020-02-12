const path = require('path');
const fs = require('fs')
const replaceExt = require('replace-ext')
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const { getJSONConfig, getRelatedPath, isEmptyObject } = require('./utils');

const APP_ROOT = process.cwd();

// const ASSETS_EXTS = ['.json', '.wxml', '.wxss', '.scss', '.less']; // file-loader会生成很多文件,TODO 可不可以把生成的资源放在原路径，如果开启，可在emit的回调里做处理：删除对应的assets
const ASSETS_EXTS = ['.json'];

class MPWebpackPlugin {
	constructor(options) {
		let { dirname } = options || {};
		this.entries = []; // 所有的页面和组件的路径，数组元素都为相对于src的路径
		this.assets = [];
		this.dirname = dirname || path.resolve(APP_ROOT, 'src'); // 小程序代码所在的根目录
	}

	apply(compiler) {
		this.compiler = compiler;
		let options = compiler.options;
		
		let entry = path.resolve(APP_ROOT, options.entry);
		let config = replaceExt(entry, '.json');
		entry = replaceExt(path.relative(this.dirname, entry), '');
		this.entries.push(entry);

		this.initPages(config);

		/* ----------  Hooks  ------------- */
		compiler.hooks.entryOption.tap('MPWebpackPlugin', (context, entry) => {
			this.loadEntries(context);
			this.loadAssets(context);
			// 返回 true 告诉 webpack 内置插件就不要处理入口文件了
			return true;
		});
		// 监听 watchRun 事件
		compiler.hooks.watchRun.tap('MinaWebpackPlugin', (compiler, done) => {
			this.loadEntries(compiler.rootContext);
			done && done();
		});
		// 所有模块的转换和代码块对应的文件已经生成好， 需要输出的资源即将输出
		compiler.hooks.emit.tapAsync('MPWebpackPlugin', (compilation, callback) => {
			// TODO 会将所有构建生成的文件全部不输出，TODO 优化
			delete compilation.assets['mp_assets.js']; // 不输出mp_assets.js
			callback();
		});
	}

	// 根据pages和subpackages找到小程序内的所有页面
	initPages(entryConfig) {
		let {pages = [], subpackages = []} = getJSONConfig(entryConfig);

		[...pages, ...subpackages].forEach(page => {
			if (!this.entries.includes(page)) {
				this.entries.push(page);
				this.getAssetsFiles(page);
				this.getComponents(page);
			}
		});
	}

	/**
	 * 获取引用到的组件路径
	 * @param {*} usingPath 引用者的文件路径
	 */
	getComponents(usingPath) {
		let { jsonFile } = getRelatedPath(this.dirname, usingPath);
		if (jsonFile && fs.existsSync(jsonFile)) {
			const { usingComponents } = getJSONConfig(jsonFile);
			const isEmpty = isEmptyObject(usingComponents);
			if (!isEmpty) {
				let paths = Object.values(usingComponents); // 引用的组件路径
				paths.map((cPath) => {
					let absoluteUsingPath = path.resolve(this.dirname, usingPath);
					let folder = path.dirname(absoluteUsingPath);
					let componentPath = path.resolve(folder, cPath); // 引用组件的绝对路径
					componentPath = path.relative(this.dirname, componentPath); // 组件相对于dirname的路径
					if (!this.entries.includes(componentPath)) {
						this.entries.push(componentPath);
					}
					this.getAssetsFiles(componentPath);
					this.getComponents(componentPath);
				})
			}
		}
	}

	/**
	 * 获取wxml、wxss、scss、json等文件，左右js文件的依赖
	 */
	getAssetsFiles(entry) {
		let entryPath = path.join(this.dirname, entry);
		for (const ext of ASSETS_EXTS) {
			let file = entryPath + ext
			if (fs.existsSync(file) && !this.assets.includes(file)) {
				this.assets.push(file);
			}
		}
	}
	
	loadEntries(context) {
		this.entries.forEach(name => {
			let file = path.resolve(this.dirname, `${name}.js`);
			if (fs.existsSync(file)) {
				let entry = path.relative(APP_ROOT, file);
				new SingleEntryPlugin(context, `./${entry}`, name).apply(this.compiler);
			}
		});
	}

	loadAssets(context) {
		// 会生成mp_assets.js文件
		new  MultiEntryPlugin(context, this.assets, 'mp_assets').apply(this.compiler);
	}
}

module.exports = MPWebpackPlugin;

















// // 在webpack的entry配置处理完之后执行
// compiler.hooks.entryOption.tap('MPWebpackPlugin', (context, entry) => {
// 	console.log('entryOption', entry);
// });
// // compilation包含了当前的模块资源、编译生成资源、变化的文件
// compiler.hooks.compilation.tap('MPWebpackPlugin', (compilation, compilationParams) => {
// 	console.log('compilation');
// });

// // 监听文件变化
// compiler.hooks.watchRun.tapAsync('MPWebpackPlugin', (compiler) => {
// 	console.log('watchRun');
// });

// compiler.hooks.afterCompile.tapAsync('MPWebpackPlugin', (compilation, callback) => {
// 	// 把 HTML 文件添加到文件依赖列表，好让 Webpack 去监听 HTML 模块文件，在 HTML 模版文件发生变化时重新启动一次编译
// 	console.log('afterCompile');
// 	callback();
// });

// // 所有模块的转换和代码块对应的文件已经生成好， 需要输出的资源即将输出
// compiler.hooks.emit.tapAsync('MPWebpackPlugin', (compilation, callback) => {
// 	callback();
// });