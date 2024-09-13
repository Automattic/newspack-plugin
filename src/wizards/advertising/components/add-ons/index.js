/* globals newspack_ads_wizard */

/**
 * Ad Add-ons component
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { PluginToggle, ActionCard } from '../../../../components/src';
import { useState } from 'react';

const MediaKitToggle = () => {
	const [ isInFlight, setInFlight ] = useState( false );
	const [ editURL, setEditURL ] = useState(
		newspack_ads_wizard.media_kit_page_edit_url
	);
	const [ pageStatus, setPageStatus ] = useState(
		newspack_ads_wizard.media_kit_page_status
	);

	const toggleMediaKit = () => {
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/billboard/media-kit',
			method: pageStatus === 'publish' ? 'DELETE' : 'POST',
		} )
			.then( ( { edit_url, page_status } ) => {
				setEditURL( edit_url );
				setPageStatus( page_status );
			} )
			.finally( () => setInFlight( false ) );
	};

	const props = editURL
		? {
				href: editURL,
				actionText: __( 'Edit Media Kit page', 'newspack-plugin' ),
		  }
		: {};

	let description = __(
		'Media Kit page is not published. Click the link to edit and publish it.',
		'newspack-plugin'
	);
	let toggleEnabled = false;
	switch ( pageStatus ) {
		case 'publish':
			description = __(
				'Media Kit page is published. Click the link to edit it, or toggle this card to unpublish.',
				'newspack-plugin'
			);
			toggleEnabled = true;
			break;
		case '':
			description = __(
				'Media Kit page has not been created. Toggle this card to create it.',
				'newspack-plugin'
			);
			toggleEnabled = true;
			break;
	}

	return (
		<ActionCard
			disabled={ isInFlight || ! toggleEnabled }
			title={ __( 'Media Kit', 'newspack-plugin' ) }
			description={ description }
			toggle
			toggleChecked={ Boolean( editURL ) }
			toggleOnChange={ toggleMediaKit }
			{ ...props }
		/>
	);
};

export default () => (
	<>
		<PluginToggle
			plugins={ {
				'super-cool-ad-inserter': {
					actionText: __( 'Configure', 'newspack-plugin' ),
					href: '#/settings',
				},
				'ad-refresh-control': {
					actionText: __( 'Configure', 'newspack-plugin' ),
					href: '#/settings',
				},
			} }
		/>
		<MediaKitToggle />
	</>
);
