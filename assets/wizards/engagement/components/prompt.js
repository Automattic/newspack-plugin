/* eslint-disable no-nested-ternary */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { BaseControl, CheckboxControl, TextareaControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { Fragment, useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { stringify } from 'qs';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Grid, Notice, TextControl, WebPreview } from '../../../components/src';

export default function Prompt( { inFlight, prompt, setInFlight, setPrompts } ) {
	const [ values, setValues ] = useState( {} );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ success, setSuccess ] = useState( false );

	useEffect( () => {
		if ( Array.isArray( prompt?.user_input_fields ) ) {
			const fields = {};
			prompt.user_input_fields.forEach( field => {
				if ( field.value ) {
					fields[ field.name ] = field.value;
				} else {
					fields[ field.name ] = 'array' === field.type ? [] : '';
				}
			} );
			setValues( fields );
		}
	}, [ prompt ] );

	// Clear success message after a few seconds.
	useEffect( () => {
		setTimeout( () => setSuccess( false ), 5000 );
	}, [ success ] );

	// TODO: Create a preview popup on the fly.
	const getPreviewUrl = ( { options } ) => {
		const { placement, trigger_type: triggerType } = options;
		const previewQueryKeys = window.newspack_engagement_wizard?.preview_query_keys || {};
		const abbreviatedKeys = {};
		Object.keys( options ).forEach( key => {
			if ( previewQueryKeys.hasOwnProperty( key ) ) {
				abbreviatedKeys[ previewQueryKeys[ key ] ] = options[ key ];
			}
		} );

		let previewURL = '/';
		if ( 'archives' === placement && window.newspack_engagement_wizard?.preview_archive ) {
			previewURL = window.newspack_engagement_wizard.preview_archive;
		} else if (
			( 'inline' === placement || 'scroll' === triggerType ) &&
			window &&
			window.newspack_engagement_wizard?.preview_post
		) {
			previewURL = window.newspack_engagement_wizard?.preview_post;
		}

		return `${ previewURL }?${ stringify( { ...abbreviatedKeys } ) }`;
	};

	// console.log( prompt, getPreviewUrl( prompt ) );

	const savePrompt = ( slug, data ) => {
		setError( false );
		setSuccess( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation/campaign',
			method: 'post',
			data: {
				slug,
				data,
			},
		} )
			.then( fetchedPrompts => {
				setPrompts( fetchedPrompts );
				setSuccess( __( 'Prompt saved.', 'newspack' ) );
			} )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};

	return (
		<ActionCard
			isMedium
			expandable
			collapse={ prompt.ready }
			title={ prompt.title }
			description={ sprintf(
				// Translators: Status of the prompt.
				__( 'Status: %s', 'newspack' ),
				prompt.ready ? __( 'Ready', 'newspack' ) : __( 'Pending', 'newspack' )
			) }
			checkbox={ prompt.ready ? 'checked' : 'unchecked' }
		>
			{
				<Grid columns={ 2 } gutter={ 16 } className="newspack-ras-campaign__grid">
					<div className="newspack-ras-campaign__fields">
						{ prompt.user_input_fields.map( field => (
							<Fragment key={ field.name }>
								{ 'array' === field.type && Array.isArray( field.options ) && (
									<BaseControl
										id={ `newspack-engagement-wizard__${ field.name }` }
										label={ field.label }
									>
										{ field.options.map( option => (
											<CheckboxControl
												key={ option.id }
												disabled={ inFlight }
												label={ option.label }
												value={ option.id }
												checked={ values[ field.name ]?.indexOf( option.id ) > -1 }
												onChange={ value => {
													const toUpdate = { ...values };
													if ( ! value && toUpdate[ field.name ].indexOf( option.id ) > -1 ) {
														toUpdate[ field.name ].value = toUpdate[ field.name ].splice(
															toUpdate[ field.name ].indexOf( option.id ),
															1
														);
														setIsDirty( true );
													}
													if ( value && toUpdate[ field.name ].indexOf( option.id ) === -1 ) {
														toUpdate[ field.name ].push( option.id );
														setIsDirty( true );
													}
													setValues( toUpdate );
												} }
											/>
										) ) }
									</BaseControl>
								) }
								{ 'string' === field.type && 100 < field.max_length && (
									<TextareaControl
										label={ field.label }
										disabled={ inFlight }
										help={ `${ values[ field.name ]?.length || 0 } / ${ field.max_length }` }
										onChange={ value => {
											if ( value.length > field.max_length ) {
												return;
											}

											const toUpdate = { ...values };
											toUpdate[ field.name ] = value;
											if ( JSON.stringify( toUpdate ) !== JSON.stringify( values ) ) {
												setIsDirty( true );
											}
											setValues( toUpdate );
										} }
										placeholder={ field.default }
										rows={ 10 }
										value={ values[ field.name ] || '' }
									/>
								) }
								{ 'string' === field.type && 100 >= field.max_length && (
									<TextControl
										label={ field.label }
										disabled={ inFlight }
										help={ `${ values[ field.name ]?.length || 0 } / ${ field.max_length }` }
										onChange={ value => {
											if ( value.length > field.max_length ) {
												return;
											}

											const toUpdate = { ...values };
											toUpdate[ field.name ] = value;
											if ( JSON.stringify( toUpdate ) !== JSON.stringify( values ) ) {
												setIsDirty( true );
											}
											setValues( toUpdate );
										} }
										placeholder={ field.default }
										value={ values[ field.name ] || '' }
									/>
								) }
							</Fragment>
						) ) }
						{ error && (
							<Notice
								noticeText={ error?.message || __( 'Something went wrong.', 'newspack' ) }
								isError
							/>
						) }
						{ success && <Notice noticeText={ success } isSuccess /> }
						<Button
							isPrimary
							onClick={ () => savePrompt( prompt.slug, values ) }
							disabled={ inFlight || ! isDirty }
						>
							{ inFlight
								? __( 'Saving…', 'newspack' )
								: sprintf(
										// Translators: Save or Update settings.
										__( '%s prompt settings', 'newspack' ),
										prompt.ready ? __( 'Update', 'newspack' ) : __( 'Save', 'newspack' )
								  ) }
						</Button>
						<Button isSecondary>{ __( 'Preview prompt', 'newspack' ) }</Button>
					</div>
				</Grid>
			}
		</ActionCard>
	);
}
