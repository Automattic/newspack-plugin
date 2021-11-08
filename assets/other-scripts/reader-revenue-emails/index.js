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

const TestEmail = compose( [
	withSelect( select => {
		const { getCurrentPostId } = select( 'core/editor' );
		return { postId: getCurrentPostId() };
	} ),
	withDispatch( dispatch => {
		const { savePost } = dispatch( 'core/editor' );
		const { createNotice } = dispatch( 'core/notices' );
		return {
			savePost,
			createNotice,
		};
	} ),
] )( ( { postId, savePost, createNotice } ) => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ testedEmailRecipient, setTestedEmailRecipient ] = useState(
		newspack_emails.current_user_email
	);
	useEffect( () => {
		createNotice(
			'info',
			__( 'This email will be sent to a reader after they contribute to your site.', 'newspack' ),
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
				recipient: testedEmailRecipient,
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
							label: __( 'the contact email to your site', 'newspack' ),
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
			<PluginDocumentSettingPanel name="email-testing-panel" title={ __( 'Testing', 'newspack' ) }>
				<TextControl
					label={ __( 'Send to', 'newspack' ) }
					value={ testedEmailRecipient }
					type="email"
					onChange={ setTestedEmailRecipient }
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
