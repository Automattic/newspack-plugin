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
import { PluginInstaller, ActionCard, withWizardScreen } from '../../../../components/src';

const SECTIONS = values( newspack_reader_revenue.emails );

const Emails = () => {
	const [ pluginsReady, setPluginsReady ] = useState( null );

	if ( ! pluginsReady ) {
		return (
			<PluginInstaller
				style={ pluginsReady ? { display: 'none' } : {} }
				plugins={ [ 'newspack-newsletters' ] }
				onStatus={ res => setPluginsReady( res.complete ) }
				onInstalled={ () => window.location.reload() }
				withoutFooterButton={ true }
			/>
		);
	}

	return (
		<>
			{ SECTIONS.map( ( section, i ) => (
				<ActionCard
					key={ i }
					title={ section.label }
					titleLink={ section.edit_link }
					href={ section.edit_link }
					description={ section.description }
					actionText={ sprintf(
						/* translators: %s: Email subject */
						__( 'Edit the "%s" email', 'newspack' ),
						section.subject
					) }
					secondaryActionText={ __( 'Send a test email', 'newspack' ) }
				/>
			) ) }
		</>
	);
};

export default withWizardScreen( Emails );
