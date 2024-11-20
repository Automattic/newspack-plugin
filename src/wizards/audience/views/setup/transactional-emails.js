/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { ActionCard, withWizardScreen } from '../../../../components/src';
import WizardsTab from '../../../wizards-tab';

export default withWizardScreen( ( { emails } ) => {
	return (
		<WizardsTab
			title={ __( 'Transactional Emails', 'newspack-plugin' ) }
			description={ __(
				"Customize the content of transactional emails.",
				'newspack-plugin'
			) }
		>
			{ emails.map( email => (
				<ActionCard
					key={ email.post_id }
					title={ email.label }
					titleLink={ email.edit_link }
					href={ email.edit_link }
					description={ email.description }
					actionText={ __( 'Edit', 'newspack-plugin' ) }
					isSmall
				/>
			) ) }
		</WizardsTab>
	);
} );
