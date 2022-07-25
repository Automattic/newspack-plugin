/* global newspack_blocks */

/**
 * External dependencies
 */
import { intersection } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { Spinner, Notice, TextControl, ToggleControl, PanelBody } from '@wordpress/components';
import { RichText, useBlockProps, InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import './editor.scss';

export default function ReaderRegistrationEdit( {
	setAttributes,
	attributes: {
		placeholder,
		label,
		privacyLabel,
		newsletterSubscription,
		displayListDescription,
		newsletterTitle,
		newsletterLabel,
		haveAccountLabel,
		signInLabel,
		lists,
		className,
	},
} ) {
	const blockProps = useBlockProps();
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

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Form settings', 'newspack' ) }>
					<TextControl
						label={ __( 'Input placeholder', 'newspack' ) }
						value={ placeholder }
						disabled={ inFlight }
						onChange={ value => setAttributes( { placeholder: value } ) }
					/>
				</PanelBody>
				{ newspack_blocks.has_newsletters && (
					<PanelBody title={ __( 'Newsletter Subscription', 'newspack' ) }>
						<ToggleControl
							label={ __( 'Enable newsletter subscription', 'newspack' ) }
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
										<Notice isDismissible={ false } status="error">
											{ __( 'You must enable lists for subscription.', 'newspack-newsletters' ) }
										</Notice>
									</div>
								) }
								<ToggleControl
									label={ __( 'Display list description', 'newspack-newsletters' ) }
									checked={ displayListDescription }
									disabled={ inFlight }
									onChange={ () =>
										setAttributes( { displayListDescription: ! displayListDescription } )
									}
								/>
								{ lists.length < 1 && (
									<div style={ { marginBottom: '1.5rem' } }>
										<Notice isDismissible={ false } status="error">
											{ __( 'You must select at least one list.', 'newspack-newsletters' ) }
										</Notice>
									</div>
								) }
								{ Object.keys( listConfig ).length > 0 && <p>{ __( 'Lists', 'newspack' ) }:</p> }
								{ Object.keys( listConfig ).map( listId => (
									<ToggleControl
										key={ listId }
										label={ listConfig[ listId ].title }
										checked={ lists.includes( listId ) }
										disabled={ inFlight }
										onChange={ () => {
											if ( ! lists.includes( listId ) ) {
												setAttributes( { lists: lists.concat( listId ) } );
											} else {
												setAttributes( { lists: lists.filter( id => id !== listId ) } );
											}
										} }
									/>
								) ) }
								<p>
									<a href={ newspack_blocks.newsletters_url }>
										{ __( 'Manage your subscription lists', 'newspack-newsletters' ) }
									</a>
								</p>
							</>
						) }
					</PanelBody>
				) }
			</InspectorControls>
			<div { ...blockProps }>
				<div className={ `newspack-registration ${ className }` }>
					<form onSubmit={ ev => ev.preventDefault() }>
						<div className="newspack-registration__form-content">
							{ newsletterSubscription && lists.length ? (
								<div className="newspack-reader__lists">
									{ lists?.length > 1 && (
										<RichText
											onChange={ value => setAttributes( { newsletterTitle: value } ) }
											placeholder={ __( 'Newsletters title…', 'newspack' ) }
											value={ newsletterTitle }
											tagName="h3"
										/>
									) }
									<ul>
										{ lists.map( listId => (
											<li key={ listId }>
												<span className="newspack-reader__lists__checkbox">
													<input type="checkbox" checked readOnly />
												</span>
												<span className="newspack-reader__lists__details">
													<span className="newspack-reader__lists__label">
														<span className="newspack-reader__lists__title">
															{ lists.length === 1 ? (
																<RichText
																	onChange={ value => setAttributes( { newsletterLabel: value } ) }
																	placeholder={ __( 'Subscribe to our newsletter', 'newspack' ) }
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
													</span>
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
												onChange={ value => setAttributes( { label: value } ) }
												placeholder={ __( 'Sign up', 'newspack' ) }
												value={ label }
												tagName="span"
											/>
										</button>
									</div>
									{ newspack_blocks.has_google_oauth && (
										<div className="newspack-registration__logins">
											<div className="newspack-registration__logins__separator">
												<div />
												<div>{ __( 'OR', 'newspack' ) }</div>
												<div />
											</div>
											<button className="newspack-registration__logins__google">
												<span
													dangerouslySetInnerHTML={ { __html: newspack_blocks.google_logo_svg } }
												/>
												<span>{ __( 'Sign in with Google', 'newspack' ) }</span>
											</button>
										</div>
									) }
									<div className="newspack-registration__response" />
								</div>

								<div className="newspack-registration__help-text">
									<RichText
										onChange={ value => setAttributes( { privacyLabel: value } ) }
										placeholder={ __( 'Terms & Conditions statement…', 'newspack' ) }
										value={ privacyLabel }
										tagName="p"
									/>
									<p>
										<RichText
											onChange={ value => setAttributes( { haveAccountLabel: value } ) }
											placeholder={ __( 'Already have an account?', 'newspack' ) }
											value={ haveAccountLabel }
											tagName="span"
										/>{ ' ' }
										<a href="/my-account" onClick={ ev => ev.preventDefault() }>
											<RichText
												onChange={ value => setAttributes( { signInLabel: value } ) }
												placeholder={ __( 'Sign In', 'newspack' ) }
												value={ signInLabel }
												tagName="span"
											/>
										</a>
									</p>
								</div>
							</div>
						</div>
					</form>
				</div>
			</div>
		</>
	);
}
