const newspack_wisepops_data = {};

wisepops_newspack.keys.forEach(element => {
	newspack_wisepops_data[element] = newspackReaderActivation.store.get( element);
});

if ( window.wisepops && typeof window.wisepops !== 'undefined' ) {
	window.wisepops( 'properties', newspack_wisepops_data );

	// TODO: Get more data from Reader Activation to pass to Wisepops.
	// window.newspackRAS = window.newspackRAS || [];
	// window.newspackRAS.push( function ( ras ) {
	// 	console.log( ras.store.getAll() );
	// });

	window.wisepops('listen', 'after-form-submit', function(event) {
		const emailValue = event.target.elements['email'].value;
		newspackReaderActivation.dispatchActivity( 'should_register', {
			email: emailValue,
			registrationMethod: 'Wisepops',
		} );
	});
}
