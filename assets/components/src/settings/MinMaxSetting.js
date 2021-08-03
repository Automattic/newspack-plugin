/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { CheckboxControl, TextControl } from '../';

const MinMaxSetting = ( {
	min,
	max,
	onChangeMin,
	onChangeMax,
	minPlaceholder,
	maxPlaceholder,
} ) => {
	return (
		<>
			<div className="newspack-settings__min-max">
				<CheckboxControl
					checked={ min > 0 }
					onChange={ value => onChangeMin( value ? 1 : 0 ) }
					label={ __( 'Min', 'newspack' ) }
				/>
				<TextControl
					data-testid="min-articles-input"
					type="number"
					value={ min }
					placeholder={ minPlaceholder }
					onChange={ value => onChangeMin( value > 0 ? value : 0 ) }
				/>
			</div>
			<div className="newspack-settings__min-max">
				<CheckboxControl
					checked={ max > 0 }
					onChange={ value => onChangeMax( value ? min || 1 : 0 ) }
					label={ __( 'Max', 'newspack' ) }
				/>
				<TextControl
					type="number"
					value={ max }
					placeholder={ maxPlaceholder }
					onChange={ value => onChangeMax( value > 0 ? value : 0 ) }
				/>
			</div>
		</>
	);
};
export default MinMaxSetting;
