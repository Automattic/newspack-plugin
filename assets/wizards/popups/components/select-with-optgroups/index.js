/**
 * Select with optgroups.
 */

/**
 * WordPress dependencies.
 */

/**
 * Internal dependencies.
 */

const SelectWithOptGroups = ( { options, value, onChange } ) => {
	return (
		<select
			onChange={ event => {
				event.preventDefault();
				onChange( event.target.value );
			} }
			value={ value }
		>
			{ options.map( ( { label, value, options }, index ) => {
				if ( options && options.length > 0 ) {
					return (
						<optgroup label={ label } key={ index }>
							{ options.map( ( { label: optionLabel, value: optionValue } ) => (
								<option key={ optionValue } value={ optionValue }>
									{ optionLabel }
								</option>
							) ) }
						</optgroup>
					);
				}
				return (
					<option key={ index } value={ value }>
						{ label }
					</option>
				);
			} ) }
		</select>
	);
};
export default SelectWithOptGroups;
