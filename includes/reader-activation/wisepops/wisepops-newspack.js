const newspack_wisepops_data = {};

wisepops_newspack.keys.forEach(element => {
	newspack_wisepops_data[element] = newspackReaderActivation.store.get( element);
});

if ( window.wisepops && typeof window.wisepops !== 'undefined' ) {
	window.wisepops( 'properties', newspack_wisepops_data );
}
