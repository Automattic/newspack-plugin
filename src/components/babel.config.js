module.exports = api => {
	api.cache( true );
	return {
		extends: 'newspack-scripts/config/babel.config.js',
		presets: [ '@babel/preset-react' ],
	};
};
