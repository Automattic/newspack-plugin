/* globals newspack_reader_revenue*/

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { values } from 'lodash';

/**
 * Internal dependencies
 */
import { PluginInstaller, ActionCard, Notice, withWizardScreen } from '../../../../components/src';

const EMAILS = values( newspack_reader_revenue.emails );

const Emails = () => {
	const [ pluginsReady, setPluginsReady ] = useState( null );

	if ( false === pluginsReady ) {
		return (
			<>
				<Notice isError>
					{ __(
						'Newspack uses Newspack Newsletters to handle editing email-type content. Please activate this plugin to proceed.',
						'newspack'
					) }
				</Notice>
				<Notice isError>
					{ __(
						'Until this feature is configured, default Stripe receipts will be used.',
						'newspack'
					) }
				</Notice>
				<PluginInstaller
					style={ pluginsReady ? { display: 'none' } : {} }
					plugins={ [ 'newspack-newsletters' ] }
					onStatus={ res => setPluginsReady( res.complete ) }
					onInstalled={ () => window.location.reload() }
					withoutFooterButton={ true }
				/>
			</>
		);
	}

	return (
		<>
			{ EMAILS.map( email => {
				const isActive = email.status === 'publish';
				return (
					<ActionCard
						key={ email.post_id }
						title={ email.label }
						titleLink={ email.edit_link }
						href={ email.edit_link }
						description={ email.description }
						actionText={ sprintf(
							/* translators: %s: Email subject */
							__( 'Edit the "%s" email', 'newspack' ),
							email.subject
						) }
						{ ...( isActive
							? {}
							: {
									notification: __(
										'This email is not active – the default Stripe receipt will be used. Edit and publish the email to activate it.',
										'newspack'
									),
									notificationLevel: 'error',
							  } ) }
						secondaryActionText={ __( 'Send a test email', 'newspack' ) }
					/>
				);
			} ) }
		</>
	);
};

export default withWizardScreen( Emails );
