/* global newspack_dashboard */

import '../../shared/js/public-path';

/**
 * External dependencies.
 */
import qs from 'qs';

/**
 * WordPress dependencies.
 */
import { useEffect, useState, Fragment, render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { GlobalNotices, Button, Waiting, Footer, Grid, NewspackLogo } from '../../components/src';
import DashboardCard from './views/dashboardCard';
import './style.scss';

const Dashboard = ( { items } ) => {
	const params = qs.parse( window.location.search );
	const authCode = params.code;
	const [ authState, setAuthState ] = useState( {} );

	const userBasicInfo = authState.user_basic_info;
	const canUseOauth = authState.can_google_auth;

	const displayAuth = canUseOauth && ! authCode;

	useEffect( () => {
		apiFetch( { path: '/newspack/v1/oauth/google' } ).then( setAuthState );
	}, [] );

	useEffect( () => {
		if ( canUseOauth && authCode ) {
			apiFetch( {
				path: '/newspack/v1/oauth/google',
				method: 'POST',
				data: {
					auth_code: authCode,
					state: params.state,
				},
			} )
				.then( () => {
					window.location =
						'/wp-admin/admin.php?' +
						qs.stringify( {
							page: 'newspack',
							'newspack-notice': __( 'Successfully authenticated with Google.', 'newspack' ),
						} );
				} )
				.catch( e => {
					window.location =
						'/wp-admin/admin.php?' +
						qs.stringify( {
							page: 'newspack',
							'newspack-notice':
								'_error_' +
								( e.message ||
									__( 'Something went wrong during authentication with Google.', 'newspack' ) ),
						} );
				} );
		}
	}, [ canUseOauth ] );

	const goToAuthPage = () => {
		apiFetch( {
			path: '/newspack/v1/oauth/google/get-url',
		} ).then( url => ( window.location = url ) );
	};

	return (
		<Fragment>
			<div className="newspack-wizard__header">
				<div className="newspack-wizard__header__inner">
					<NewspackLogo centered height={ 72 } />
				</div>
			</div>
			<div className="mw6 mr-auto ml-auto">
				<GlobalNotices />
			</div>
			{ authCode && (
				<div className="pt4 flex justify-around">
					<Waiting />
				</div>
			) }
			{ displayAuth ? (
				<div className="pt4 ph3 flex justify-around">
					{ userBasicInfo ? (
						<span>
							{ __( 'Authorized Google as', 'newspack' ) } <strong>{ userBasicInfo.email }</strong>.
						</span>
					) : (
						<div>
							<p>
								{ __( 'Click on the button below to authorise Newspack with Google.', 'newspack' ) }
							</p>
							<br />
							<Button isPrimary onClick={ goToAuthPage }>
								{ __( 'Authorise', 'newspack' ) }
							</Button>
						</div>
					) }
				</div>
			) : null }
			<div className="newspack-wizard newspack-wizard__content">
				<Grid columns={ 3 } gutter={ 32 }>
					{ items.map( card => (
						<DashboardCard { ...card } key={ card.slug } />
					) ) }
				</Grid>
			</div>
			<Footer />
		</Fragment>
	);
};
render( <Dashboard items={ newspack_dashboard } />, document.getElementById( 'newspack' ) );
