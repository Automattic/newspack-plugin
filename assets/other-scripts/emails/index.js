/* globals newspack_emails */

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Button, Spinner, TextControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import { hooks } from '../../components/src';
import './style.scss';

const ReaderRevenueEmailSidebar = compose( [
	withSelect( select => {
		const { getEditedPostAttribute, getCurrentPostId } = select( 'core/editor' );
		const postMeta = getEditedPostAttribute( 'meta' );
		return {
			title: getEditedPostAttribute( 'title' ),
			postId: getCurrentPostId(),
			postMeta,
		};
	} ),
	withDispatch( dispatch => {
		const { savePost, editPost } = dispatch( 'core/editor' );
		const { createNotice } = dispatch( 'core/notices' );
		return {
			savePost,
			createNotice,
			updatePostMeta: key => value => editPost( { meta: { [ key ]: value } } ),
			updatePostTitle: title => editPost( { title } ),
		};
	} ),
] )( ( { postId, savePost, title, postMeta, updatePostTitle, createNotice } ) => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ settings, updateSettings ] = hooks.useObjectState( {
		testRecipient: newspack_emails.current_user_email,
	} );
	const configMetaName = postMeta[ newspack_emails.email_config_name_meta ];
	const config = newspack_emails.configs[ configMetaName ];

	useEffect( () => {
		if ( config?.editor_notice ) {
			createNotice( 'info', config.editor_notice, {
				isDismissible: false,
			} );
		}
		createNotice(
			'info',
			sprintf(
				/* translators: 1: "From" email address 2: "From" email name */
				__( 'This email will appear as sent from "%1$s" email address, by "%2$s".', 'newspack' ),
				config.from_email || newspack_emails.from_email,
				config.from_name || newspack_emails.from_name
			),
			{
				isDismissible: false,
			}
		);
	}, [] );

	const sendTestEmail = async () => {
		setInFlight( true );
		await savePost();
		apiFetch( {
			path: `/newspack/v1/newspack-emails/test`,
			method: 'POST',
			data: {
				recipient: settings.testRecipient,
				post_id: postId,
			},
		} )
			.then( () => {
				createNotice( 'success', __( 'Test email sent!', 'newspack' ) );
			} )
			.catch( () => {
				createNotice( 'error', __( 'Test email was not sent.', 'newspack' ) );
			} )
			.finally( () => {
				setInFlight( false );
			} );
	};
	return (
		<>
			{ config.available_placeholders?.length && (
				<PluginDocumentSettingPanel
					name="email-instructions-panel"
					title={ __( 'Instructions', 'newspack' ) }
				>
					{ __(
						'Use the following placeholders to insert dynamic content in the email:',
						'newspack'
					) }
					<ul>
						{ config.available_placeholders.map( ( item, i ) => (
							<li key={ i }>
								– <code>{ item.template }</code>: { item.label }
							</li>
						) ) }
					</ul>
				</PluginDocumentSettingPanel>
			) }
			<PluginDocumentSettingPanel
				name="email-settings-panel"
				title={ __( 'Settings', 'newspack' ) }
			>
				<TextControl
					label={ __( 'Subject', 'newspack' ) }
					value={ title }
					onChange={ updatePostTitle }
				/>
			</PluginDocumentSettingPanel>
			<PluginDocumentSettingPanel name="email-testing-panel" title={ __( 'Testing', 'newspack' ) }>
				<TextControl
					label={ __( 'Send to', 'newspack' ) }
					value={ settings.testRecipient }
					type="email"
					onChange={ updateSettings( 'testRecipient' ) }
				/>
				<div className="newspack__testing-controls">
					<Button isPrimary onClick={ sendTestEmail } disabled={ inFlight }>
						{ inFlight ? __( 'Sending…', 'newspack' ) : __( 'Send', 'newspack' ) }
					</Button>
					{ inFlight && <Spinner /> }
				</div>
			</PluginDocumentSettingPanel>
		</>
	);
} );

registerPlugin( 'newspack-emails-sidebar', {
	render: ReaderRevenueEmailSidebar,
	icon: null,
} );
