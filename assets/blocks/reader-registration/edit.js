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

const getListCheckboxId = listId => {
	return 'newspack-newsletters-list-checkbox-' + listId;
};

export default function ReaderRegistrationEdit( {
	setAttributes,
	attributes: {
		placeholder,
		label,
		newsletterSubscription,
		displayListDescription,
		newsletterLabel,
		lists,
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
					<TextControl
						label={ __( 'Button label', 'newspack' ) }
						value={ label }
						disabled={ inFlight }
						onChange={ value => setAttributes( { label: value } ) }
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
								{ lists.length === 1 && (
									<TextControl
										label={ __( 'Newsletter subscription label', 'newspack' ) }
										value={ newsletterLabel }
										disabled={ inFlight }
										onChange={ value => setAttributes( { newsletterLabel: value } ) }
									/>
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
				<div className="newspack-reader-registration">
					<form onSubmit={ ev => ev.preventDefault() }>
						{ lists.length ? (
							<ul className="newspack-newsletters-lists">
								{ lists.map( listId => (
									<li key={ listId }>
										<span className="list-checkbox">
											<input id={ getListCheckboxId( listId ) } type="checkbox" checked readOnly />
										</span>
										<span className="list-details">
											<label htmlFor={ getListCheckboxId( listId ) }>
												<span className="list-title">
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
													<span className="list-description">
														{ listConfig[ listId ]?.description }
													</span>
												) }
											</label>
										</span>
									</li>
								) ) }
							</ul>
						) : null }
						<input type="email" placeholder={ placeholder } />
						<button type="submit">
							<RichText
								onChange={ value => setAttributes( { label: value } ) }
								placeholder={ __( 'Register', 'newspack' ) }
								value={ label }
								tagName="span"
							/>
						</button>
					</form>
				</div>
			</div>
		</>
	);
}
