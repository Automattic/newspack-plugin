/* globals newspack_ads_wizard */

/**
 * Ad Add-ons component
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Notice } from '@wordpress/components';

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

	if (
		! newspack_ads_wizard.media_kit_page_status &&
		! newspack_ads_wizard.media_kit_page_edit_url
	) {
		return (
			<Notice isDismissible={ false } status="error">
				{ __(
					'Something went wrong, the Media Kit feature is unavailable.',
					'newspack-plugin'
				) }
			</Notice>
		);
	}

	const isPagePublished = pageStatus === 'publish';

	const toggleMediaKit = () => {
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/billboard/media-kit',
			method: isPagePublished ? 'DELETE' : 'POST',
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
				actionText: isPagePublished
					? __( 'Edit Media Kit page', 'newspack-plugin' )
					: __( 'Review draft page', 'newspack-plugin' ),
		  }
		: {};

	let description = __(
		'Media kit page is created but unpublished, click the link to review and publish.',
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
		case 'non-existent':
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
			isButtonEnabled={ true }
			title={ __( 'Media Kit', 'newspack-plugin' ) }
			description={ description }
			toggle
			toggleChecked={ Boolean( editURL ) && isPagePublished }
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
