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
import { PluginInstaller, Settings, withWizardScreen } from '../../../../components/src';

const { SettingsCard } = Settings;

const SECTIONS = values( newspack_reader_revenue.emails );

const Emails = () => {
	const [ pluginsReady, setPluginsReady ] = useState( null );
	return pluginsReady === true ? (
		SECTIONS.map( ( section, i ) => (
			<SettingsCard key={ i } title={ section.label } columns={ 1 }>
				<div>
					<p>{ section.description }</p>
					{ section.post_id === 0 ? (
						<div>{ __( 'Missing email', 'newspack' ) }</div>
					) : (
						<a href={ section.edit_link }>
							{ sprintf(
								/* translators: %s: Email subject */
								__( 'Edit the "%s" email', 'newspack' ),
								section.subject
							) }
						</a>
					) }
				</div>
			</SettingsCard>
		) )
	) : (
		<PluginInstaller
			style={ pluginsReady ? { display: 'none' } : {} }
			plugins={ [ 'newspack-newsletters' ] }
			onStatus={ res => setPluginsReady( res.complete ) }
			onInstalled={ () => window.location.reload() }
			withoutFooterButton={ true }
		/>
	);
};

export default withWizardScreen( Emails );
