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

const TestEmail = compose( [
	withSelect( select => {
		const { getEditedPostAttribute, getCurrentPostId } = select( 'core/editor' );
		const postMeta = getEditedPostAttribute( 'meta' );
		return { postId: getCurrentPostId(), postMeta };
	} ),
	withDispatch( dispatch => {
		const { savePost, editPost } = dispatch( 'core/editor' );
		const { createNotice } = dispatch( 'core/notices' );
		return {
			savePost,
			createNotice,
			updatePostMeta: key => value => editPost( { meta: { [ key ]: value } } ),
		};
	} ),
] )( ( { postId, savePost, postMeta, updatePostMeta, createNotice } ) => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ settings, updateSettings ] = hooks.useObjectState( {
		testRecipient: newspack_emails.current_user_email,
	} );
	useEffect( () => {
		createNotice(
			'info',
			__(
				'This email will be sent to a reader after they contribute to your site. The title will be used the email subject.',
				'newspack'
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
			path: `/newspack/v1/wizard/newspack-reader-revenue-wizard/emails/test`,
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
			<PluginDocumentSettingPanel
				name="email-instructions-panel"
				title={ __( 'Instructions', 'newspack' ) }
			>
				{ __(
					'Use the following placehoders to insert dynamic content in the email:',
					'newspack'
				) }
				<ul>
					{ [
						{ label: __( 'the payment amount', 'newspack' ), template: '*AMOUNT*' },
						{ label: __( 'payment date', 'newspack' ), template: '*DATE*' },
						{
							label: __( 'payment method (last four digits of the card used)', 'newspack' ),
							template: '*PAYMENT_METHOD*',
						},
						{
							label: __(
								'the contact email to your site (same as the "From" email address)',
								'newspack'
							),
							template: '*CONTACT_EMAIL*',
						},
						{
							label: __( 'automatically-generated receipt link', 'newspack' ),
							template: '*RECEIPT_URL*',
						},
					].map( ( item, i ) => (
						<li key={ i }>
							– <code>{ item.template }</code>: { item.label }
						</li>
					) ) }
				</ul>
			</PluginDocumentSettingPanel>
			<PluginDocumentSettingPanel
				name="email-settings-panel"
				title={ __( 'Settings', 'newspack' ) }
			>
				<TextControl
					label={ __( '"From" name', 'newspack' ) }
					value={ postMeta.from_name }
					onChange={ updatePostMeta( 'from_name' ) }
				/>
				<TextControl
					label={ __( '"From" email address', 'newspack' ) }
					value={ postMeta.from_email }
					type="email"
					onChange={ updatePostMeta( 'from_email' ) }
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

registerPlugin( 'newspack-reader-revenue-emails-sidebar', {
	render: TestEmail,
	icon: null,
} );
