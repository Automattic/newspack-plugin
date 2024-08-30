/**
 * Newspack > Settings > Theme and Brand > Typography. Component for setting typography to use in your theme.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { TextareaControl, ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	Grid,
	hooks,
	SelectControl,
	TextControl,
} from '../../../../../components/src';
import { getFontImportURL, getFontsList, isFontInOptions } from './utils';

const TYPOGRAPHY_OPTIONS = [
	{ value: 'curated', label: __( 'Default', 'newspack' ) },
	{ value: 'custom', label: __( 'Custom', 'newspack' ) },
];

export default function Typography( {
	typography,
	updateTypography,
}: {
	typography: Typography;
	updateTypography: ( a: Typography ) => void;
} ) {
	const [ typographyOptionsType, updateTypographyOptionsType ] = useState(
		TYPOGRAPHY_OPTIONS[ 0 ].value
	);

	function updateTypographyState(
		objectOrKey: Partial< Typography > | string,
		change?: string | boolean
	) {
		if ( typeof objectOrKey === 'object' ) {
			updateTypography( { ...typography, ...objectOrKey } );
			return;
		}
		if ( ! change ) {
			return;
		}
		updateTypography( { ...typography, [ objectOrKey ]: change } );

		const { font_header: headerFont, font_body: bodyFont } = typography;
		if (
			( headerFont && ! isFontInOptions( headerFont ) ) ||
			( bodyFont && ! isFontInOptions( bodyFont ) )
		) {
			updateTypographyOptionsType( TYPOGRAPHY_OPTIONS[ 1 ].value );
		}
	}

	// useEffect( () => {
	// 	const { font_header: headerFont, font_body: bodyFont } = typography;
	// 	console.log(
	// 		{ headerFont, bodyFont },
	// 		isFontInOptions( headerFont ),
	// 		isFontInOptions( bodyFont )
	// 	);
	// 	if (
	// 		( headerFont && ! isFontInOptions( headerFont ) ) ||
	// 		( bodyFont && ! isFontInOptions( bodyFont ) )
	// 	) {
	// 		updateTypographyOptionsType( TYPOGRAPHY_OPTIONS[ 1 ].value );
	// 	}
	// }, [ typography.font_body, typography.font_header ] );

	// useEffect( () => {
	// 	const { font_header: headerFont, font_body: bodyFont } = typography;
	// 	console.log(
	// 		{ headerFont, bodyFont },
	// 		isFontInOptions( headerFont ),
	// 		isFontInOptions( bodyFont )
	// 	);
	// 	if (
	// 		( headerFont && ! isFontInOptions( headerFont ) ) ||
	// 		( bodyFont && ! isFontInOptions( bodyFont ) )
	// 	) {
	// 		updateTypographyOptionsType( TYPOGRAPHY_OPTIONS[ 1 ].value );
	// 	}
	// }, [] );

	const renderCustomFontChoice = ( type: string ) => {
		const isHeadings = type === 'headings';
		const label = isHeadings
			? __( 'Headings', 'newspack' )
			: __( 'Body', 'newspack' );
		return (
			<Grid columns={ 1 } gutter={ 16 }>
				<TextareaControl
					label={
						label +
						' - ' +
						__( 'Font provider import code or URL', 'newspack' )
					}
					placeholder={
						'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap'
					}
					value={
						( isHeadings
							? typography.custom_font_import_code
							: typography.custom_font_import_code_alternate ) ??
						''
					}
					onChange={ e => {
						console.log( { e, isHeadings } );
						updateTypographyState(
							isHeadings
								? 'custom_font_import_code'
								: 'custom_font_import_code_alternate',
							e
						);
					} }
					rows={ 3 }
				/>
				<TextControl
					label={ label + ' - ' + __( 'Font name', 'newspack' ) }
					value={
						isHeadings
							? typography.font_header
							: typography.font_body
					}
					onChange={ ( e: string ) => {
						console.log( { e, isHeadings } );
						updateTypographyState(
							isHeadings ? 'font_header' : 'font_body',
							e
						);
					} }
				/>
				<SelectControl
					label={
						label + ' - ' + __( 'Font fallback stack', 'newspack' )
					}
					options={ [
						{ value: 'serif', label: __( 'Serif', 'newspack' ) },
						{
							value: 'sans-serif',
							label: __( 'Sans Serif', 'newspack' ),
						},
						{
							value: 'display',
							label: __( 'Display', 'newspack' ),
						},
						{
							value: 'monospace',
							label: __( 'Monospace', 'newspack' ),
						},
					] }
					value={
						isHeadings
							? typography.font_header_stack
							: typography.font_body_stack
					}
					onChange={ ( e: string ) =>
						updateTypographyState(
							isHeadings
								? 'font_header_stack'
								: 'font_body_stack',
							e
						)
					}
				/>
			</Grid>
		);
	};

	return (
		<Grid columns={ 1 } gutter={ 16 }>
			<pre>{ JSON.stringify( typographyOptionsType, null, 2 ) }</pre>
			<SelectControl
				label={ __( 'Typography Options', 'newspack' ) }
				hideLabelFromVision
				value={
					typographyOptionsType ? typographyOptionsType : 'curated'
				}
				onChange={ updateTypographyOptionsType }
				buttonOptions={ TYPOGRAPHY_OPTIONS }
			/>
			<Grid gutter={ 32 }>
				{ typographyOptionsType === 'curated' ? (
					<>
						<SelectControl
							label={ __( 'Headings', 'newspack' ) }
							optgroups={ getFontsList( true ) }
							value={ typography.font_header }
							onChange={ ( value: string, group: FontGroup ) => {
								updateTypographyState( {
									font_header: value,
									custom_font_import_code:
										getFontImportURL( value ),
									font_header_stack: group?.fallback,
								} );
							} }
						/>
						<SelectControl
							label={ __( 'Body', 'newspack' ) }
							optgroups={ getFontsList() }
							value={ typography.font_body }
							onChange={ ( value: string, group: FontGroup ) => {
								updateTypographyState( {
									font_body: value,
									custom_font_import_code_alternate:
										getFontImportURL( value ),
									font_body_stack: group?.fallback,
								} );
							} }
						/>
					</>
				) : (
					<>
						{ renderCustomFontChoice( 'headings' ) }
						{ renderCustomFontChoice( 'body' ) }
					</>
				) }
			</Grid>
			<ToggleControl
				checked={ typography.accent_allcaps === true }
				onChange={ () => updateTypographyState( 'accent_allcaps' ) }
				label={ __( 'Use all-caps for accent text', 'newspack' ) }
			/>
		</Grid>
	);
}
