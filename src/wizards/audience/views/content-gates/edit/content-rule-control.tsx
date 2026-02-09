/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import {
	CheckboxControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ContentRuleControlTaxonomy from './content-rule-control-taxonomy';
import { Grid } from '../../../../../../packages/components/src';

export default function ContentRuleControl( { slug, value, exclusion, onChange, onChangeExclusion }: GateContentRuleControlProps ) {
	const rule = window.newspackAudienceContentGates.available_content_rules[ slug ];

	if ( ! rule || ! Array.isArray( value ) ) {
		return null;
	}
	return (
		<div className="newspack-content-gates__content-rule-control">
			<ToggleGroupControl
				label={ __( 'Mode', 'newspack-plugin' ) }
				value={ exclusion ? 'exclude' : 'include' }
				onChange={ () => onChangeExclusion?.( exclusion ? false : true ) }
				hideLabelFromVision
				isBlock
				__next40pxDefaultSize
			>
				<ToggleGroupControlOption label={ __( 'Include', 'newspack-plugin' ) } value="include" />
				<ToggleGroupControlOption label={ __( 'Exclude', 'newspack-plugin' ) } value="exclude" />
			</ToggleGroupControl>
			{ rule.options && rule.options.length > 0 ? (
				<Grid columns={ 2 } gutter={ 16 }>
					{ ( rule.options || [] ).map( option => (
						<CheckboxControl
							key={ option.value }
							label={ option.label }
							checked={ value.includes( option.value ) }
							onChange={ () =>
								onChange( value.includes( option.value ) ? value.filter( v => v !== option.value ) : [ ...value, option.value ] )
							}
						/>
					) ) }
				</Grid>
			) : (
				<ContentRuleControlTaxonomy slug={ slug } value={ value } onChange={ onChange } />
			) }
		</div>
	);
}
