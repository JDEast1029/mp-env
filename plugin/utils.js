const fs = require('fs');
const path = require('path');

/**
 * 格式化入口文件
 */
const formatEntry = (entry) => {

}

/**
 * 根据文件路径获取相关联的小程序文件（.wxml、.wxss、.js、.json）
 * @param {*} entry 
 */
const getRelatedPath = (root, entry) => {
	return {
		jsFile: path.resolve(root, `${entry}.js`),
		jsonFile: path.resolve(root, `${entry}.json`),
		wxmlFile: path.resolve(root, `${entry}.wxml`),
		wxssFile: path.resolve(root, `${entry}.wxss`),
	}
}

/**
 * 判断对象是否为空
 * @param {*} obj 
 */
const isEmptyObject = (obj) => {
	if (!obj) return true;
	let keys = Object.keys(obj);
	return keys.length === 0;
}

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

const getDirFile = (dir) => {
	if (fs.lstatSync(dir).isDirectory()) {
		return fs.readdirSync(dir);
	} else {
		dir = path.dirname(dir);
		return getDirFile(dir);
	}
}

module.exports = {
	getJSONConfig,
	formatEntry,
	getRelatedPath,
	isEmptyObject,
	getDirFile
} 