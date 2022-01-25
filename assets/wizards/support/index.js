/* global newspack_support_data */

import '../../shared/js/public-path';

/**
 * External dependencies
 */
import { parse } from 'qs';

/**
 * WordPress dependencies.
 */
import { render, createElement, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies.
 */
import { Wizard } from '../../components/src';
import { CreateTicket, ListTickets, Chat, Loading } from './views';
import { getReturnPath } from './utils';

/**
 * Support view.
 *
 * This is also the location of redirect URI for WPCOM.
 * It means WPCOM will redirect here after authentication - this component
 * will read the auth variables provided by in location hash and pass
 * them to the backend, where they will be saved.
 */
const SupportWizard = () => {
	const hasHashDataWithToken = () => {
		const { hash } = window.location;
		const hashData = parse( hash.substring( 1 ) );
		return hashData.access_token ? hashData : false;
	};

	const { wizardApiFetch } = useDispatch( Wizard.STORE_NAMESPACE );
	useEffect( () => {
		const hashData = hasHashDataWithToken();
		if ( hashData ) {
			wizardApiFetch( {
				path: '/newspack/v1/oauth/wpcom/token',
				method: 'POST',
				data: hashData,
			} ).then( () => {
				const returnPath = getReturnPath();
				if ( returnPath ) {
					if ( returnPath.indexOf( window.location.search ) > 0 ) {
						window.location = returnPath;
						// Same page, needs reload for the Router to take over rendering.
						window.location.reload();
					} else {
						window.location = returnPath;
					}
				}
			} );
		}
	}, [] );

	if ( hasHashDataWithToken() ) {
		return <Loading />;
	}

	const isPreLaunch = newspack_support_data.IS_PRE_LAUNCH;

	const sections = [
		{
			label: __( 'Submit ticket', 'newspack' ),
			path: '/ticket',
			render: CreateTicket,
		},
		{
			label: __( 'Tickets', 'newspack' ),
			path: '/tickets-list',
			render: ListTickets,
		},
		...( isPreLaunch
			? []
			: [
					{
						label: __( 'Chat', 'newspack' ),
						path: '/chat',
						render: Chat,
					},
			  ] ),
	];

	return (
		<Wizard
			headerText={ __( 'Support', 'newspack' ) }
			subHeaderText={ __( 'Contact customer support', 'newspack' ) }
			sections={ sections }
		/>
	);
};

render( createElement( SupportWizard ), document.getElementById( 'newspack-support-wizard' ) );
