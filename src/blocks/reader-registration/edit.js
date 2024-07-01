/* global newspack_blocks */

/**
 * External dependencies
 */
import intersection from 'lodash/intersection';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { sprintf, __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import {
	useBlockProps,
	RichText,
	InspectorControls,
	useInnerBlocksProps,
	InnerBlocks,
} from '@wordpress/block-editor';
import {
	Spinner,
	Notice,
	TextControl,
	ToggleControl,
	PanelBody,
	Button,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';

const getListCheckboxId = ( listId ) => {
	return 'newspack-reader-registration-list-checkbox-' + listId;
};

const editedStateOptions = [
	{ label: __( 'Initial', 'newspack-plugin' ), value: 'initial' },
	{ label: __( 'Registration Success', 'newspack-plugin' ), value: 'registration' },
	{ label: __( 'Login Success', 'newspack-plugin' ), value: 'login' },
];
export default function ReaderRegistrationEdit( {
	setAttributes,
	attributes: {
		title,
		description,
		placeholder,
		label,
		privacyLabel,
		newsletterSubscription,
		displayListDescription,
		hideSubscriptionInput,
		newsletterTitle,
		newsletterLabel,
		haveAccountLabel,
		signInLabel,
		signedInLabel,
		lists,
		listsCheckboxes,
		className,
	},
} ) {
	const blockProps = useBlockProps();
	const [ editedState, setEditedState ] = useState( editedStateOptions[ 0 ].value );
	let { reader_activation_terms: defaultTermsText, reader_activation_url: defaultTermsUrl } =
		window.newspack_blocks;

	if ( defaultTermsUrl ) {
		defaultTermsText = `<a href="${ defaultTermsUrl }">` + defaultTermsText + '</a>';
	}

	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			renderAppender: InnerBlocks.ButtonBlockAppender,
			template: [
				// Quirk: this will only get applied to the block (as inner blocks) if it's *rendered* in the editor.
				// If the user never switches the state view, it will not be applied, so PHP code contains a fallback.
				[
					'core/paragraph',
					{
						align: 'center',
						content: __( 'Thank you for registering!', 'newspack-plugin' ),
					},
				],
			],
		}
	);
	const [ inFlight, setInFlight ] = useState( false );
	const [ listConfig, setListConfig ] = useState( {} );

	const fetchLists = () => {
		if ( newspack_blocks.has_newsletters && newsletterSubscription ) {
			setInFlight( true );
			apiFetch( {
				path: '/newspack-newsletters/v1/lists_config',
			} )
				.then( setListConfig )
				.finally( () => setInFlight( false ) );
		}
	};

	useEffect( fetchLists, [] );
	useEffect( fetchLists, [ newsletterSubscription ] );

	useEffect( () => {
		const listIds = Object.keys( listConfig );
		if ( listIds.length && ( ! lists.length || ! intersection( lists, listIds ).length ) ) {
			setAttributes( { lists: [ Object.keys( listConfig )[ 0 ] ] } );
		}
	}, [ listConfig ] );

	const shouldHideSubscribeInput = () => {
		return lists.length === 1 && hideSubscriptionInput;
	};

	const isListSelected = ( listId ) => {
		return listsCheckboxes.hasOwnProperty( listId ) && listsCheckboxes[ listId ];
	};
	const toggleListCheckbox = ( listId ) => () => {
		const newListsCheckboxes = { ...listsCheckboxes };
		newListsCheckboxes[ listId ] = ! isListSelected( listId );
		setAttributes( { listsCheckboxes: newListsCheckboxes } );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Form settings', 'newspack-plugin' ) }>
					<TextControl
						label={ __( 'Input placeholder', 'newspack-plugin' ) }
						value={ placeholder }
						disabled={ inFlight }
						onChange={ ( value ) => setAttributes( { placeholder: value } ) }
					/>
				</PanelBody>
				{ newspack_blocks.has_newsletters && (
					<PanelBody title={ __( 'Newsletter Subscription', 'newspack-plugin' ) }>
						<ToggleControl
							label={ __( 'Enable newsletter subscription', 'newspack-plugin' ) }
							checked={ !! newsletterSubscription }
							disabled={ inFlight }
							onChange={ () =>
								setAttributes( { newsletterSubscription: ! newsletterSubscription } )
							}
						/>
						{ newsletterSubscription && (
							<>
								{ inFlight && <Spinner /> }
								{ ! inFlight && ! Object.keys( listConfig ).length && (
									<div style={ { marginBottom: '1.5rem' } }>
										{ __(
											'To enable newsletter subscription, you must configure subscription lists on Newspack Newsletters.',
											'newspack-plugin'
										) }
									</div>
								) }
								{ Object.keys( listConfig ).length > 0 && (
									<>
										<ToggleControl
											label={ __( 'Display list description', 'newspack-plugin' ) }
											checked={ displayListDescription }
											disabled={ inFlight }
											onChange={ () =>
												setAttributes( { displayListDescription: ! displayListDescription } )
											}
										/>
										<ToggleControl
											label={ __(
												'Hide newsletter selection and always subscribe',
												'newspack-plugin'
											) }
											checked={ hideSubscriptionInput }
											disabled={ inFlight || lists.length !== 1 }
											onChange={ () =>
												setAttributes( { hideSubscriptionInput: ! hideSubscriptionInput } )
											}
										/>
										{ lists.length < 1 && (
											<div style={ { marginBottom: '1.5rem' } }>
												<Notice isDismissible={ false } status="error">
													{ __( 'You must select at least one list.', 'newspack-plugin' ) }
												</Notice>
											</div>
										) }
										{ Object.keys( listConfig ).length > 0 && (
											<p>{ __( 'Lists', 'newspack-plugin' ) }:</p>
										) }
										{ Object.keys( listConfig ).map( ( listId ) => (
											<ToggleControl
												key={ listId }
												label={ listConfig[ listId ].title }
												checked={ lists.includes( listId ) }
												disabled={ inFlight }
												onChange={ () => {
													if ( ! lists.includes( listId ) ) {
														setAttributes( { lists: lists.concat( listId ) } );
													} else {
														setAttributes( { lists: lists.filter( ( id ) => id !== listId ) } );
													}
												} }
											/>
										) ) }
									</>
								) }
								<p>
									<a href={ newspack_blocks.newsletters_url }>
										{ __( 'Configure your subscription lists', 'newspack-plugin' ) }
									</a>
									.
								</p>
							</>
						) }
					</PanelBody>
				) }
				<PanelBody title={ __( 'Spam protection', 'newspack-plugin' ) }>
					<p>
						{ sprintf(
							// translators: %s is either 'enabled' or 'disabled'.
							__( 'reCAPTCHA is currently %s.', 'newspack-plugin' ),
							newspack_blocks.has_recaptcha
								? __( 'enabled', 'newspack-plugin' )
								: __( 'disabled', 'newspack-plugin' )
						) }
					</p>
					{ ! newspack_blocks.has_recaptcha && (
						<p>
							{ __(
								"It's highly recommended that you enable reCAPTCHA protection to prevent spambots from using this form!",
								'newspack-plugin'
							) }
						</p>
					) }
					<p>
						<a href={ newspack_blocks.recaptcha_url }>
							{ __( 'Configure your reCAPTCHA settings.', 'newspack-plugin' ) }
						</a>
					</p>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="newspack-registration__state-bar">
					<span>{ __( 'Edited State', 'newspack-plugin' ) }</span>
					<div>
						{ editedStateOptions.map( ( option ) => (
							<Button
								key={ option.value }
								data-is-active={ editedState === option.value }
								onClick={ () => setEditedState( option.value ) }
							>
								{ option.label }
							</Button>
						) ) }
					</div>
				</div>
				{ editedState === 'initial' && (
					<div className={ `newspack-registration ${ className }` }>
						<form onSubmit={ ( ev ) => ev.preventDefault() }>
							<div className="newspack-registration__have-account">
								<RichText
									onChange={ ( value ) => setAttributes( { haveAccountLabel: value } ) }
									placeholder={ __( 'Already have an account?', 'newspack-plugin' ) }
									value={ haveAccountLabel }
									tagName="span"
								/>{ ' ' }
								<a href="/my-account" onClick={ ( ev ) => ev.preventDefault() }>
									<RichText
										onChange={ ( value ) => setAttributes( { signInLabel: value } ) }
										placeholder={ __( 'Sign In', 'newspack-plugin' ) }
										value={ signInLabel }
										tagName="span"
									/>
								</a>
							</div>
							<div className="newspack-registration__header">
								<RichText
									onChange={ ( value ) => setAttributes( { title: value } ) }
									placeholder={ __( 'Add title', 'newspack-plugin' ) }
									value={ title }
									tagName="h2"
								/>
							</div>
							<RichText
								onChange={ ( value ) => setAttributes( { description: value } ) }
								placeholder={ __( 'Add description', 'newspack-plugin' ) }
								value={ description }
								tagName="p"
							/>
							<div className="newspack-registration__form-content">
								{ ! shouldHideSubscribeInput() && newsletterSubscription && lists.length ? (
									<div className="newspack-reader__lists">
										{ lists?.length > 1 && (
											<RichText
												onChange={ ( value ) => setAttributes( { newsletterTitle: value } ) }
												placeholder={ __( 'Newsletters title…', 'newspack-plugin' ) }
												value={ newsletterTitle }
												tagName="h3"
											/>
										) }
										<ul>
											{ lists.map( ( listId ) => (
												<li key={ listId }>
													<span className="newspack-reader__lists__checkbox">
														<input
															id={ getListCheckboxId( listId ) }
															type="checkbox"
															checked={ isListSelected( listId ) }
															onChange={ toggleListCheckbox( listId ) }
														/>
													</span>
													<span className="newspack-reader__lists__details">
														<label
															htmlFor={ getListCheckboxId( listId ) }
															className="newspack-reader__lists__label"
														>
															<span className="newspack-reader__lists__title">
																{ lists.length === 1 ? (
																	<RichText
																		onChange={ ( value ) =>
																			setAttributes( { newsletterLabel: value } )
																		}
																		placeholder={ __(
																			'Subscribe to our newsletter',
																			'newspack-plugin'
																		) }
																		value={ newsletterLabel }
																		tagName="span"
																	/>
																) : (
																	listConfig[ listId ]?.title
																) }
															</span>
															{ displayListDescription && (
																<span className="newspack-reader__lists__description">
																	{ listConfig[ listId ]?.description }
																</span>
															) }
														</label>
													</span>
												</li>
											) ) }
										</ul>
									</div>
								) : null }
								<div className="newspack-registration__main">
									<div>
										<div className="newspack-registration__inputs">
											<input type="email" placeholder={ placeholder } />
											<button type="submit">
												<RichText
													onChange={ ( value ) => setAttributes( { label: value } ) }
													placeholder={ __( 'Sign up', 'newspack-plugin' ) }
													value={ label }
													tagName="span"
												/>
											</button>
										</div>

										{ newspack_blocks.has_google_oauth && (
											<div className="newspack-reader__logins">
												<div className="newspack-reader__logins__separator">
													<div />
													<div>{ __( 'OR', 'newspack-plugin' ) }</div>
													<div />
												</div>
												<button className="newspack-reader__logins__google">
													<span
														dangerouslySetInnerHTML={ { __html: newspack_blocks.google_logo_svg } }
													/>
													<span>{ __( 'Sign in with Google', 'newspack-plugin' ) }</span>
												</button>
											</div>
										) }
										<div className="newspack-registration__response" />
									</div>
									<div className="newspack-registration__help-text">
										<RichText
											onChange={ ( value ) => setAttributes( { privacyLabel: value } ) }
											placeholder={ __( 'Terms & Conditions statement…', 'newspack-plugin' ) }
											value={ privacyLabel || defaultTermsText }
											tagName="p"
										/>
									</div>
								</div>
							</div>
						</form>
					</div>
				) }
				{ editedState === 'registration' && (
					<>
						<div className="newspack-registration__icon" />
						<div { ...innerBlocksProps } />
					</>
				) }
				{ editedState === 'login' && (
					<>
						<div className="newspack-registration__icon" />
						<RichText
							align="center"
							onChange={ ( value ) => setAttributes( { signedInLabel: value } ) }
							placeholder={ __( 'Logged in message…', 'newspack-plugin' ) }
							value={ signedInLabel }
							tagName="p"
						/>
					</>
				) }
			</div>
		</>
	);
}
