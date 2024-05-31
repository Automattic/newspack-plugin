import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import WizardsPluginCard from '../../../../wizards-plugin-card';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

const Connections = () => {
	const { wizardApiFetch, isFetching, errorMessage, error } = useWizardApiFetch(
		`/newspack-settings/connections/plugins/google-site-kit`
	);
	const [ result, setResult ] = useState( null );
	const [ errorObj, setErrorObj ] = useState( null );
	useEffect( () => {
		wizardApiFetch(
			{ path: '/newspack/v1/plugins/jetpack' },
			{
				onSuccess( result ) {
					console.log( result );
					setResult( result );
				},
			}
		);
		wizardApiFetch(
			{ path: '/newspack/v1/plugins/jetpacks' },
			{
				onError( error ) {
					setErrorObj( error );
				},
			}
		);
	}, [] );
	return (
		<div className="newspack-dashboard__section">
			<h2>Connections</h2>
			<pre>
				{ JSON.stringify(
					{
						'GET:/newspack/v1/plugins/jetpack': result,
						'GET:/newspack/v1/plugins/jetpacks': errorObj,
						isFetching,
						error,
					},
					null,
					2
				) }
			</pre>
			<WizardsPluginCard
				{ ...{
					slug: 'google-site-kit',
					name: __( 'Google Analytics', 'newspack-plugin' ),
					path: '/newspack/v1/plugins/google-site-kit',
					description( errorMessage, isFetching, status ) {
						if ( errorMessage ) {
							return __( 'Error!', 'newspack-plugin' );
						}
						if ( isFetching ) {
							return __( 'Loading…', 'newspack-plugin' );
						}
						if ( status === 'inactive' ) {
							return __( 'Not connected', 'newspack-plugin' );
						}
						return __( 'Connected', 'newspack-plugin' );
					},
					actionText: __( 'View', 'newspack-plugin' ),
				} }
			/>
		</div>
	);
};

export default Connections;
