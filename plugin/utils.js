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

module.exports = {
	formatEntry,
	getRelatedPath,
	isEmptyObject
} 