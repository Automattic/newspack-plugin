module.exports = ( { env } ) => {
	const isTest = env( 'test' );
	return {
		presets: [
			...( isTest ? [ '@babel/preset-env' ] : [] ),
			'@automattic/calypso-build/babel/default',
			'@automattic/calypso-build/babel/wordpress-element',
		],
	};
};
