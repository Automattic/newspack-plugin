/**
 * Newspack > Settings > Emails.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';
import Recirculation from './recirculation';
import { hooks } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

export default function DisplaySettings() {
	const [ data, setData ] = hooks.useObjectState( {
		relatedPostsEnabled: false,
		relatedPostsError: null,
		relatedPostsMaxAge: 0,
		relatedPostsUpdated: false,
	} );
	const { wizardApiFetch } = useWizardApiFetch(
		'newspack-settings/display-settings'
	);

	useEffect( () => {
		wizardApiFetch< RecirculationData >(
			{
				path: '/newspack/v1/wizard/newspack-engagement-wizard/related-content',
			},
			{ onSuccess: () => {} }
		);
	}, [] );

	return (
		<WizardsTab title={ __( 'Display Settings', 'newspack-plugin' ) }>
			<WizardSection title={ __( 'Recirculation', 'newspack-plugin' ) }>
				<Recirculation update={ setData } data={ data } />
			</WizardSection>
		</WizardsTab>
	);
}
