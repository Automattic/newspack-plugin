/**
 * Inline configure view for an experimental tool.
 * Replaces the tab content; the Settings nav tabs remain visible.
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { TextareaControl, TextControl, SelectControl, ToggleControl } from '@wordpress/components';
import { chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button } from '../../../../../../packages/components/src';
import type { Tool, ToolField } from './types';

function FieldRenderer( {
	field,
	value,
	onChange,
	error,
}: {
	field: ToolField;
	value: string | number | boolean | undefined;
	onChange: ( val: string | boolean ) => void;
	error?: string;
} ) {
	const help = error ? <span style={ { color: '#cc1818' } }>{ error }</span> : field.help;
	switch ( field.type ) {
		case 'textarea':
			return <TextareaControl label={ field.label } help={ help } value={ String( value ?? '' ) } onChange={ onChange } />;
		case 'text':
			return <TextControl label={ field.label } help={ help } value={ String( value ?? '' ) } onChange={ onChange } />;
		case 'select':
			return (
				<SelectControl
					label={ field.label }
					help={ help }
					value={ String( value ?? '' ) }
					options={ field.options ?? [] }
					onChange={ onChange }
				/>
			);
		case 'toggle':
			return <ToggleControl label={ field.label } help={ help } checked={ !! value } onChange={ onChange } />;
		case 'display':
			return (
				<div className="experimental-tools__display-field">
					<strong>{ field.label }</strong>
					<span>{ String( field.value ?? '' ) }</span>
				</div>
			);
		default:
			return null;
	}
}

export default function ConfigureView( {
	tool,
	isFetching,
	onSave,
	onBack,
}: {
	tool: Tool;
	isFetching?: boolean;
	onSave: ( fields: Record< string, string | boolean > ) => void;
	onBack: () => void;
} ) {
	const editableFields = tool.fields.filter( ( f: ToolField ) => f.type !== 'display' );
	const displayFields = tool.fields.filter( ( f: ToolField ) => f.type === 'display' );

	const initialValues: Record< string, string | boolean > = {};
	editableFields.forEach( ( field: ToolField ) => {
		initialValues[ field.key ] = ( field.value as string | boolean ) ?? field.default ?? '';
	} );
	const [ values, setValues ] = useState< Record< string, string | boolean > >( initialValues );

	const [ errors, setErrors ] = useState< Record< string, string > >( {} );

	const handleChange = ( key: string, value: string | boolean ) => {
		setValues( prev => ( { ...prev, [ key ]: value } ) );
		setErrors( prev => {
			const next = { ...prev };
			delete next[ key ];
			return next;
		} );
	};

	const validate = (): boolean => {
		const newErrors: Record< string, string > = {};
		editableFields.forEach( ( field: ToolField ) => {
			const val = values[ field.key ];
			if ( ( field.validation === 'float' || field.validation === 'integer' ) && typeof val === 'string' && val !== '' ) {
				const num = Number( val );
				if ( isNaN( num ) || val.trim() === '' || ( field.validation === 'integer' && ! /^\d+$/.test( val ) ) ) {
					newErrors[ field.key ] =
						field.validation === 'integer'
							? __( 'Must be a whole number.', 'newspack-plugin' )
							: __( 'Must be a number.', 'newspack-plugin' );
				} else if ( field.min !== undefined && num < field.min ) {
					/* translators: %s: minimum allowed value. */
					newErrors[ field.key ] = sprintf( __( 'Minimum value is %s.', 'newspack-plugin' ), String( field.min ) );
				} else if ( field.max !== undefined && num > field.max ) {
					/* translators: %s: maximum allowed value. */
					newErrors[ field.key ] = sprintf( __( 'Maximum value is %s.', 'newspack-plugin' ), String( field.max ) );
				}
			}
		} );
		setErrors( newErrors );
		return Object.keys( newErrors ).length === 0;
	};

	const handleSave = () => {
		if ( validate() ) {
			onSave( values );
		}
	};

	return (
		<form
			className={ `newspack-wizard__sections experimental-tools__configure${ isFetching ? ' is-fetching' : '' }` }
			onSubmit={ ( e: React.FormEvent ) => {
				e.preventDefault();
				handleSave();
			} }
		>
			<div className="experimental-tools__configure-header">
				<Button icon={ chevronLeft } label={ __( 'Back', 'newspack-plugin' ) } onClick={ onBack } isLink />
				<h1>{ tool.label }</h1>
			</div>
			<p className="newspack-wizard__sections__description">{ tool.description }</p>

			<div className="experimental-tools__configure-fields">
				{ editableFields.map( ( field: ToolField ) => (
					<FieldRenderer
						key={ field.key }
						field={ field }
						value={ values[ field.key ] }
						onChange={ ( val: string | boolean ) => handleChange( field.key, val ) }
						error={ errors[ field.key ] }
					/>
				) ) }
				{ displayFields.map( ( field: ToolField ) => (
					<FieldRenderer key={ field.key } field={ field } value={ field.value } onChange={ () => {} } />
				) ) }
			</div>

			<Button variant="primary" type="submit" disabled={ isFetching }>
				{ __( 'Save', 'newspack-plugin' ) }
			</Button>

			<p className="experimental-tools__usage-note">
				{
					/* translators: 1: tool name, 2: usage count. */
					sprintf( __( '%1$s was used %2$s times in the last 30 days.', 'newspack-plugin' ), tool.label, String( tool.usage_count ) )
				}
			</p>
		</form>
	);
}
