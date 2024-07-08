/**
 * Newspack > Settings > Emails > Emails section
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies.
 */
import values from 'lodash/values';

/**
 * Internal dependencies.
 */
import { PluginInstaller, Notice } from '../../../../../components/src';
import WizardsActionCard from '../../../../wizards-action-card';
import WizardsPluginCard from '../../../../wizards-plugin-card';

const EMAILS = values( window.newspackSettings.emails.sections.emails.all );
const postType = window.newspackSettings.emails.sections.emails.email_cpt;

const Emails = () => {
	const [ pluginsReady, setPluginsReady ] = useState( false );
	const [ error, setError ] = useState< boolean | Error >( false );
	const [ inFlight, setInFlight ] = useState( false );
	const [ emails, setEmails ] = useState( EMAILS );

	const updateStatus = ( postId: number, status: string ) => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: `/wp/v2/${ postType }/${ postId }`,
			method: 'post',
			data: { status },
		} )
			.then( () => {
				setEmails(
					emails.map( email => {
						if ( email.post_id === postId ) {
							return { ...email, status };
						}
						return email;
					} )
				);
			} )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};

	if ( false === pluginsReady ) {
		return (
			<>
				<Notice isError>
					{ __(
						'Newspack uses Newspack Newsletters to handle editing email-type content. Please activate this plugin to proceed.',
						'newspack'
					) }
					<br />
					{ __( 'Until this feature is configured, default receipts will be used.', 'newspack' ) }
				</Notice>
				<WizardsPluginCard
					slug="newspack-newsletters"
					title={ __( 'Newspack Newsletters', 'newspack' ) }
					description={ __(
						'Newspack Newsletters is the plugin that powers Newspack email receipts.',
						'newspack'
					) }
					onStatusChange={ ( statuses: Record< string, boolean > ) => {
						if ( ! statuses.isLoading ) {
							setPluginsReady( statuses.isSetup );
						}
					} }
				/>
			</>
		);
	}

	return (
		<>
			<pre>{ JSON.stringify( { pluginsReady, emails }, null, 2 ) }</pre>
			{ emails.map( email => {
				const isActive = email.status === 'publish';
				return (
					<WizardsActionCard
						key={ email.post_id }
						disabled={ inFlight }
						title={ email.label }
						titleLink={ email.edit_link }
						href={ email.edit_link }
						description={ email.description }
						actionText={ __( 'Edit', 'newspack' ) }
						toggleChecked={ isActive }
						toggleOnChange={ value => updateStatus( email.post_id, value ? 'publish' : 'draft' ) }
						{ ...( isActive
							? {}
							: {
									notification: __(
										'This email is not active. The default receipt will be used.',
										'newspack'
									),
									notificationLevel: 'info',
							  } ) }
					>
						{ error instanceof Object && (
							<Notice
								noticeText={ error?.message ?? __( 'Something went wrong.', 'newspack' ) }
								isError
							/>
						) }
					</WizardsActionCard>
				);
			} ) }
		</>
	);
};

export default Emails;
