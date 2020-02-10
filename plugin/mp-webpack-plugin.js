const path = require('path');
const fs = require('fs')
const { formatEntry, getRelatedPath, isEmptyObject } = require('./utils');

const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')

const APP_ROOT = process.cwd();

/**
* 获取JSON文件的配置,app.json 或者页面的json
* @param {*} jsonPath 
*/
const getJSONConfig = (jsonPath) => {
   const content = fs.readFileSync(jsonPath, 'utf8');
   const {pages, subpackages, usingComponents} = JSON.parse(content);

   return {
	   pages,
	   subpackages,
	   usingComponents
   }
}

class MPWebpackPlugin {
	constructor(options) {
		let { dirname } = options || {};
		this.entries = []; // 所有的页面和组件的路径，数组元素都为相对于src的路径
		this.dirname = dirname || path.resolve(APP_ROOT, 'src'); // 小程序代码所在的根目录
	}

	apply(compiler) {
		this.compiler = compiler;
		let options = compiler.options;
		let entry = path.resolve(APP_ROOT, options.entry);

		/* ----------  Hooks  ------------- */
		compiler.hooks.entryOption.tap('MPWebpackPlugin', (context, entry) => {
			this.initPages(entry);
			this.loadEntries(context);
			// 返回 true 告诉 webpack 内置插件就不要处理入口文件了
			return true;
		});
		// 监听 watchRun 事件
		compiler.hooks.watchRun.tap('MinaWebpackPlugin', (compiler, done) => {
			// this.initPages(entry);
			this.loadEntries(compiler.rootContext);
			done && done();
		})
	}

	// 根据pages和subpackages找到小程序内的所有页面
	initPages(entry) {
		let {pages = [], subpackages = []} = getJSONConfig(entry);

		[...pages, ...subpackages].forEach(page => {
			if (!this.entries.includes(page)) {
				this.entries.push(page);
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
					let absolutePath = path.resolve(this.dirname, usingPath);
					let folder = path.dirname(absolutePath);
					let componentPath = path.resolve(folder, cPath); // 引用组件的绝对路径
					componentPath = path.relative(this.dirname, componentPath); // 组件相对于dirname的路径
					if (!this.entries.includes(componentPath)) {
						this.entries.push(componentPath);
					}
					this.getComponents(componentPath);
				})
			}
		}
	}
	
	loadEntries(context) {
		this.entries.forEach(name => {
			let filePath = path.resolve(this.dirname, name);
			let entry = path.relative(APP_ROOT, filePath);
			new SingleEntryPlugin(context, `./${entry}`, name).apply(this.compiler);
		});
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