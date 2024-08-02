import '../../shared/js/public-path';

/**
 * Syndication
 */

/**
 * WordPress dependencies.
 */
import { render, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Wizard } from '../../components/src';
import { Intro } from './views';

const SyndicationWizard = () => (
	<Wizard
		headerText={ __( 'Syndication', 'newspack' ) }
		subHeaderText={ __( 'Distribute your content across multiple websites', 'newspack' ) }
		sections={ [
			{
				label: __( 'Main', 'newspack' ),
				path: '/',
				render: Intro,
			},
		] }
	/>
);

render(
	createElement( SyndicationWizard ),
	document.getElementById( 'newspack-syndication-wizard' )
);
