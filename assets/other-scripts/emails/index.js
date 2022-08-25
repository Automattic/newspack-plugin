/* globals newspack_emails */

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
] )( ( { postId, savePost, title, postMeta, updatePostTitle, updatePostMeta, createNotice } ) => {
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
				<TextControl
					label={ __( '"From" name', 'newspack' ) }
					value={ config.from_name || postMeta.from_name }
					onChange={ updatePostMeta( 'from_name' ) }
					disabled={ config.from_name }
					help={
						config.from_name
							? __( '"From" name is not editable because of the email configuration.', 'newspack' )
							: undefined
					}
				/>
				<TextControl
					label={ __( '"From" email address', 'newspack' ) }
					value={ config.from_email || postMeta.from_email }
					type="email"
					onChange={ updatePostMeta( 'from_email' ) }
					disabled={ config.from_email }
					help={
						config.from_email
							? __( '"From" email is not editable because of the email configuration.', 'newspack' )
							: undefined
					}
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
