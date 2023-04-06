/* eslint-disable no-nested-ternary */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { BaseControl, CheckboxControl, ExternalLink, TextareaControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { Fragment, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { ActionCard, Button, Grid, Notice, TextControl } from '../../../../components/src';

export default function Prompt( { inFlight, prompt } ) {
	const [ values, setValues ] = useState( {} );
	const [ isDirty, setIsDirty ] = useState( false );

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
												onChange={ value => {
													const toUpdate = { ...values };
													if ( ! value && toUpdate[ field.name ].indexOf( option.id ) > -1 ) {
														toUpdate[ field.name ].value = toUpdate[ field.name ].splice(
															toUpdate[ field.name ].indexOf( option.id ),
															1
														);
													}
													if ( value && toUpdate[ field.name ].indexOf( option.id ) === -1 ) {
														toUpdate[ field.name ].push( option.id );
													}
													if ( JSON.stringify( toUpdate ) !== JSON.stringify( values ) ) {
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
						<Button
							isPrimary
							onClick={ () => {
								// TODO: Save values.
								console.log( prompt.slug, values );
							} }
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
