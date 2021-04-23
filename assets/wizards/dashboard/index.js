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
import { Icon, plugins } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import {
	GlobalNotices,
	Button,
	Card,
	Waiting,
	Footer,
	Grid,
	NewspackLogo,
} from '../../components/src';
import DashboardCard from './views/dashboardCard';
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

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
			<GlobalNotices />
			<div className="newspack-wizard__header">
				<div className="newspack-wizard__header__inner">
					<NewspackLogo centered height={ 72 } />
				</div>
			</div>
			<div className="newspack-wizard newspack-wizard__content">
				<Grid columns={ 3 } gutter={ 32 }>
					{ items.map( card => (
						<DashboardCard { ...card } key={ card.slug } />
					) ) }
					{ authCode && (
						<div className="flex justify-around items-center">
							<Waiting />
						</div>
					) }
					{ displayAuth ? (
						<Card className={ classnames( 'newspack-dashboard-card', 'google-oauth2' ) }>
							{ userBasicInfo ? (
								<div className="newspack-dashboard-card__contents">
									<Icon icon={ plugins } />
									<div className="newspack-dashboard-card__header">
										<h2>{ __( 'Google OAuth2' ) }</h2>
										<p>
											{ __( 'Authorized Google as', 'newspack' ) }{' '}
											<strong>{ userBasicInfo.email }</strong>
										</p>
									</div>
								</div>
							) : (
								<Button onClick={ goToAuthPage }>
									<div className="newspack-dashboard-card__contents">
										<Icon icon={ plugins } />
										<div className="newspack-dashboard-card__header">
											<h2>{ __( 'Google OAuth2' ) }</h2>
											<p>{ __( 'Authorize Newspack with Google', 'newspack' ) }</p>
										</div>
									</div>
								</Button>
							) }
						</Card>
					) : null }
				</Grid>
			</div>
			<Footer />
		</Fragment>
	);
};
render( <Dashboard items={ newspack_dashboard } />, document.getElementById( 'newspack' ) );
