/**
 * WordPress dependencies
 */
import { Fragment, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, hooks, withWizardScreen, Waiting, Notice } from '../../../../components/src';

const HeaderCode = ( { wizardApiFetch } ) => {
	const [ state, updateState ] = hooks.useObjectState( { isLoading: true } );
	const handleUpdate = response => {
		updateState( {
			...response,
			isLoading: false,
			errorMessage:
				response.is_site_kit_configured === false
					? __( 'Please activate and configure the Site Kit Plugin.', 'newspack' )
					: null,
		} );
	};
	const handleError = response =>
		updateState( { errorMessage: response.message || __( 'An error has occurred.', 'newspack' ) } );
	useEffect( () => {
		wizardApiFetch( {
			path: '/newspack/v1/wizard/advertising/gam/',
			quiet: true,
		} )
			.then( handleUpdate )
			.catch( handleError );
	}, [] );
	const refreshGAMData = () => {
		wizardApiFetch( {
			path: '/newspack/v1/wizard/advertising/gam/refresh',
			method: 'POST',
			quiet: true,
		} )
			.then( handleUpdate )
			.catch( handleError );
	};

	const renderLegacyCodeInfo = () =>
		state.legacy_hardcoded_gam_network_code ? (
			<p>
				{ __( 'Your user-supplied GAM Network code is', 'newspack' ) }{' '}
				<b>{ state.legacy_hardcoded_gam_network_code }</b>.
			</p>
		) : null;

	if ( state.errorMessage ) {
		return (
			<>
				{ renderLegacyCodeInfo() }
				<Notice isError noticeText={ state.errorMessage } />
			</>
		);
	}

	const renderGAMInfo = () =>
		state.user_email ? (
			<>
				<p>
					{ __( 'Site has authorized Google Ad Manager via Site Kit as', 'newspack' ) }{' '}
					<b>{ state.user_email }</b>
					{ __( ', using network code', 'newspack' ) } <b>{ state.network_code }</b>.
				</p>
			</>
		) : (
			<>
				<p>{ __( 'No GAM data, please refresh.', 'newspack' ) }</p>
				{ renderLegacyCodeInfo() }
			</>
		);

	return (
		<Fragment>
			{ state.isLoading ? <Waiting /> : renderGAMInfo() }
			<Button disabled={ state.isLoading } isLink onClick={ refreshGAMData }>
				{ __( 'Refresh GAM data', 'newspack' ) }
			</Button>
		</Fragment>
	);
};

export default withWizardScreen( HeaderCode );
