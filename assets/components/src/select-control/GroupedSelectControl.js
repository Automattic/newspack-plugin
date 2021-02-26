/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BaseControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { hooks } from '..';

/**
 * SelectControl with optgroup support
 */
export default function GroupedSelectControl( {
	help,
	label,
	multiple = false,
	onChange,
	optgroups = [],
	className,
	hideLabelFromVision,
	...props
} ) {
	const onChangeValue = event => {
		if ( multiple ) {
			const selectedOptions = [ ...event.target.options ].filter( ( { selected } ) => selected );
			const newValues = selectedOptions.map( ( { value } ) => value );
			onChange( newValues );
			return;
		}
		onChange( event.target.value );
	};
	const id = hooks.useUniqueId( 'group-select' );

	return (
		<BaseControl
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			id={ id }
			help={ help }
			className={ classnames( className, 'components-select-control' ) }
		>
			<select
				id={ id }
				className="components-select-control__input"
				onChange={ onChangeValue }
				aria-describedby={ !! help ? `${ id }__help` : undefined }
				multiple={ multiple }
				{ ...props }
			>
				{ optgroups.map( ( { label: optgroupLabel, options }, optgroupIndex ) => (
					<optgroup label={ optgroupLabel } key={ optgroupIndex }>
						{ options.map( ( option, optionIndex ) => (
							<option
								key={ `${ option.label }-${ option.value }-${ optionIndex }` }
								value={ option.value }
								disabled={ option.disabled }
							>
								{ option.label }
							</option>
						) ) }
					</optgroup>
				) ) }
			</select>
		</BaseControl>
	);
}
