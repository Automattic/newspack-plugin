/* globals newspack_reader_revenue*/

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import values from 'lodash/values';

/**
 * Internal dependencies
 */
import { PluginInstaller, ActionCard, Notice } from '../../../../components/src';

const EMAILS = values( newspack_reader_revenue.emails );
const postType = newspack_reader_revenue.email_cpt;

const Emails = () => {
	const [ pluginsReady, setPluginsReady ] = useState( null );
	const [ error, setError ] = useState( false );
	const [ inFlight, setInFlight ] = useState( false );
	const [ emails, setEmails ] = useState( EMAILS );

	const updateStatus = ( postId, status ) => {
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
				</Notice>
				<Notice isError>
					{ __( 'Until this feature is configured, default receipts will be used.', 'newspack' ) }
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
			{ emails.map( email => {
				const isActive = email.status === 'publish';
				return (
					<ActionCard
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
						{ error && (
							<Notice
								noticeText={ error?.message || __( 'Something went wrong.', 'newspack' ) }
								isError
							/>
						) }
					</ActionCard>
				);
			} ) }
		</>
	);
};

export default Emails;
