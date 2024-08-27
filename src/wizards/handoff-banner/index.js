import '../../shared/js/public-path';

/**
 * Handoff Banner
 */

/**
 * WordPress dependencies.
 */
import { createElement, render, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Button } from '../../components/src';
import './style.scss';

const HandoffBanner = ( {
	bodyText = __( 'Return to Newspack after completing configuration', 'newspack-plugin' ),
	primaryButtonText = __( 'Back to Newspack', 'newspack-plugin' ),
	dismissButtonText = __( 'Dismiss', 'newspack-plugin' ),
	primaryButtonURL = '/wp-admin/admin.php?page=newspack',
} ) => {
	const [ visibility, setVisibility ] = useState( true );
	return (
		visibility && (
			<div className="newspack-handoff-banner">
				<div className="newspack-handoff-banner__text">{ bodyText }</div>
				<div className="newspack-handoff-banner__buttons">
					<Button variant="secondary" isSmall onClick={ () => setVisibility( false ) }>
						{ dismissButtonText }
					</Button>
					<Button variant="primary" isSmall href={ primaryButtonURL }>
						{ primaryButtonText }
					</Button>
				</div>
			</div>
		)
	);
};

const el = document.getElementById( 'newspack-handoff-banner' );
const { primary_button_url: primaryButtonURL } = el.dataset;
render(
	createElement( HandoffBanner, {
		primaryButtonURL,
	} ),
	el
);
