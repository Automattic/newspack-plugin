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
import {
	ActionCard,
	Button,
	Grid,
	ImageUpload,
	Notice,
	TextControl,
	WebPreview,
} from '../../../components/src';

export default function Prompt( { inFlight, prompt, setInFlight, setPrompts } ) {
	const [ values, setValues ] = useState( {} );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ success, setSuccess ] = useState( false );
	const [ image, setImage ] = useState( null );

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

		if ( prompt.featured_image_id ) {
			setInFlight( true );
			apiFetch( {
				path: `/wp/v2/media/${ prompt.featured_image_id }`,
			} )
				.then( attachment => {
					if ( attachment?.source_url || attachment?.url ) {
						setImage( { url: attachment.source_url || attachment.url } );
					}
				} )
				.catch( setError )
				.finally( () => {
					setInFlight( false );
				} );
		}
	}, [ prompt ] );

	// Clear success message after a few seconds.
	useEffect( () => {
		setTimeout( () => setSuccess( false ), 5000 );
	}, [ success ] );

	// TODO: Create a preview popup on the fly.
	const getPreviewUrl = ( { options, slug } ) => {
		const { placement, trigger_type: triggerType } = options;
		const previewQueryKeys = window.newspack_engagement_wizard?.preview_query_keys || {};
		const abbreviatedKeys = { preset: slug };
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

	const savePrompt = ( slug, data ) => {
		return new Promise( ( res, rej ) => {
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
					setIsDirty( false );
					res();
				} )
				.catch( err => {
					setError( err );
					rej( err );
				} )
				.finally( () => {
					setInFlight( false );
				} );
		} );
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
											<BaseControl
												key={ option.id }
												id={ `newspack-engagement-wizard__${ option.id }` }
												className="newspack-checkbox-control"
												help={ option.description }
											>
												<CheckboxControl
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
											</BaseControl>
										) ) }
									</BaseControl>
								) }
								{ 'string' === field.type && 100 < field.max_length && (
									<TextareaControl
										className="newspack-textarea-control"
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
								{ 'int' === field.type && 'featured_image_id' === field.name && (
									<BaseControl
										id={ `newspack-engagement-wizard__${ field.name }` }
										label={ field.label }
									>
										<ImageUpload
											buttonLabel={ __( 'Choose image', 'newspack' ) }
											disabled={ inFlight }
											image={ image }
											onChange={ attachment => {
												const toUpdate = { ...values };
												toUpdate[ field.name ] = attachment?.id || 0;
												if ( toUpdate[ field.name ] !== values[ field.name ] ) {
													setIsDirty( true );
												}
												setValues( toUpdate );
												if ( attachment?.url ) {
													setImage( attachment );
												} else {
													setImage( null );
												}
											} }
										/>
									</BaseControl>
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
						<WebPreview
							url={ getPreviewUrl( prompt ) }
							renderButton={ ( { showPreview } ) => (
								<Button
									disabled={ inFlight }
									isSecondary
									onClick={ async () => {
										if ( isDirty ) {
											await savePrompt( prompt.slug, values );
										}
										showPreview();
									} }
								>
									{ __( 'Preview prompt', 'newspack' ) }
								</Button>
							) }
						/>
					</div>
				</Grid>
			}
		</ActionCard>
	);
}
