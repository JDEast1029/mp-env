const { getOptions } = require('loader-utils');
module.exports = function (source) {
	console.log(getOptions(this));
	console.log('JOSN:', JSON.parse(source));

	return source;
};