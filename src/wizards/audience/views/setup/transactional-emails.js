/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import WizardsTab from '../../../wizards-tab';
import { utils, ActionCard, withWizardScreen } from '../../../../components/src';

export default withWizardScreen(
	( { emails, saveConfig, wizardApiFetch, setInFlight, setError, config } ) => {
		const resetEmail = postId => {
			setError( false );
			setInFlight( true );
			wizardApiFetch( {
				path: `/newspack/v1/wizard/newspack-audience/reader-activation/emails/${ postId }`,
				method: 'DELETE',
				quiet: true,
			} )
				.then( e => saveConfig( { ...config, emails: e } ) )
				.catch( setError )
				.finally( () => setInFlight( false ) );
		};
		return (
			<WizardsTab
				title={ __( 'Transactional Emails', 'newspack-plugin' ) }
				description={ __(
					'Customize the content of transactional emails.',
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
						onSecondaryActionClick={ () => {
							if (
								utils.confirmAction(
									__(
										'Are you sure you want to reset the contents of this email?',
										'newspack-plugin'
									)
								)
							) {
								resetEmail( email.post_id );
							}
						} }
						secondaryActionText={ __( 'Reset', 'newspack-plugin' ) }
						secondaryDestructive={ true }
						isSmall
					/>
				) ) }
			</WizardsTab>
		);
	}
);
