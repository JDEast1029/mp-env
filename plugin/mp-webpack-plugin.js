const path = require('path');
const fs = require('fs')
const replaceExt = require('replace-ext')
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const { getJSONConfig, getRelatedPath, isEmptyObject, getDirFile } = require('./utils');

const APP_ROOT = process.cwd();

const ASSETS_EXTS = ['.json', '.wxml', '.wxss', '.scss', '.less'];
// const ASSETS_EXTS = ['.json'];

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
		
		this.initApp(options.entry);

		/* ----------  Hooks  ------------- */
		compiler.hooks.entryOption.tap('MPWebpackPlugin', (context, entry) => {
			this.loadEntries(context);
			this.loadAssets(context);
			// 返回 true 告诉 webpack 内置插件就不要处理入口文件了
			return true;
		});
		// compiler.hooks.compilation.tap('MPWebpackPlugin', (compilation) => {
		// 	compilation.hooks.succeedModule.tap('MPWebpackPlugin', (module1) => {
		// 		this.entries.forEach((entry) => {
		// 			this.getComponents(entry);
		// 		})
		// 	})
		// });
		// 监听 watchRun 事件
		compiler.hooks.watchRun.tap('MinaWebpackPlugin', (compiler, done) => {
			this.loadEntries(compiler.rootContext);
			done && done();
		});
		// 所有模块的转换和代码块对应的文件已经生成好， 需要输出的资源即将输出
		compiler.hooks.emit.tapAsync('MPWebpackPlugin', (compilation, callback) => {
			delete compilation.assets['mp_assets.js']; // 不输出mp_assets.js
			callback();
		});
	}

	initApp(entryPath) {
		entryPath = path.resolve(APP_ROOT, entryPath); // webpack入口的绝对路径
		let config = replaceExt(entryPath, '.json'); // app.json的绝对路径
		let files = getDirFile(entryPath); // src目录下的所有文件或文件夹名
		files.forEach(file => {
			if (/\.js$/.test(file)) {
				let entry = replaceExt(path.relative(this.dirname, entryPath), '');
				this.entries.push(entry);
			} else if (/\.(wxml|wxss|json|scss|less)$/.test(file)){
				let entry = path.resolve(this.dirname, file);
				this.assets.push(entry);
			}
		});
		this.initPages(config);
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
				let { alias = {} } = this.compiler.options.resolve;
				let aliasKeys = Object.keys(alias);
				paths.map((cPath) => {
					if (/^plugin:/.test(cPath)) {
						return cPath;
					}
					let absoluteUsingPath = path.resolve(this.dirname, usingPath);
					let folder = path.dirname(absoluteUsingPath);
					let componentPath;
					let [key] = aliasKeys.filter(key => new RegExp(`^${key}`).test(cPath))
					if (key) {
						let aliasPath = cPath.replace(key, alias[key]);
						componentPath = path.relative(this.dirname, aliasPath);
					} else {
						componentPath = path.resolve(folder, cPath); // 引用组件的绝对路径
						componentPath = path.relative(this.dirname, componentPath); // 组件相对于dirname的路径
					}
					
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