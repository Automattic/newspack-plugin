/**
 * Initialize listener.
 *
 * @param {Object} ras Reader Activation Library.
 */
export default function init( ras ) {

	ras.on( 'activity', function ( ev ) {
		const { action, data } = ev.detail;

		const { email, registrationMethod } = data;

		if ( action === 'should_register') {

			const payload = new FormData();
			payload.append( 'email', email );
			payload.append( 'action', 'newspack_reader_activation_should_register' );

			fetch( newspack_ras_config.ajax_url, {
				method: 'POST',
				body: payload,
			} )
				.then( response => response.json() )
				.then( ( { success, user_id } ) => {
					console.log('Should register response:', { success, user_id });
					if ( ! success ) {
						return;
					}
					ras.dispatchActivity( 'newsletter_signup', {
						email,
						lists: [],
						newsletters_subscription_method: registrationMethod
					} );

				} );
		}
	} );
}
