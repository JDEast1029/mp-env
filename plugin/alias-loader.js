const fs = require('fs');
const path = require('path');
const { isEmptyObject } = require('./utils');

module.exports = function (source) {
	// hack 用于访问 webpack 的 Compiler 对象。this._compiler将被废除，后面通过loader的options传入alias
	let { resolve = {} } = this._compiler.options || {};
	let { alias } = resolve;
	let ALIAS_REGEX_MAP = {};
	Object.keys(alias).forEach((key) => ALIAS_REGEX_MAP[key] = new RegExp(`^${key}`));

	if (fs.existsSync(this.resourcePath)) {
		const config = JSON.parse(source);
		let { usingComponents } = config || {};
		let isEmpty = isEmptyObject(usingComponents);
		if (!isEmpty) {
			let names = Object.keys(usingComponents);
			names.map((name) => {
				let value = usingComponents[name];
				for (const key in alias) {
					let regex = new RegExp(`^${key}`);
					if (regex.test(value)) {
						let relativePath = path.relative(this.context, alias[key]);
						usingComponents[name] = value.replace(regex, relativePath);
					}
				}
				return name;
			});
		}

		// TODO 输出的json文件内容没有被修改
		
		return JSON.stringify(config);
	}

	return source;
};