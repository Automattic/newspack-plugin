/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ContentRuleControlTaxonomy from './content-rule-control-taxonomy';
import { FormTokenField } from '../../../../../packages/components/src';

const noop = () => {};

export default function ContentRuleControl( { slug, value, onChange }: GateContentRuleControlProps ) {
	const rule = window.newspackAudienceContentGates.available_content_rules[ slug ];

	if ( ! rule || ! Array.isArray( value ) ) {
		return null;
	}

	if ( rule.options && rule.options.length > 0 ) {
		return (
			<div className="newspack-content-gates__content-rule-control">
				<FormTokenField
					label={ rule.name }
					value={ rule.options.filter( o => value.includes( o.value ) ).map( o => o.label ) }
					onChange={ ( items: string[] ) => onChange( rule.options?.filter( o => items.includes( o.label ) ).map( o => o.value ) ?? [] ) }
					suggestions={ rule.options.map( o => o.label ) }
					__experimentalExpandOnFocus={ true }
				/>
				<CheckboxControl
					label={ __( 'Exclusion rule', 'newspack-plugin' ) }
					help={ __( 'Apply this rule to everything EXCEPT the items matching the above.', 'newspack-plugin' ) }
					checked={ false }
					onChange={ noop }
				/>
			</div>
		);
	}

	return <ContentRuleControlTaxonomy slug={ slug } value={ value } onChange={ onChange } />;
}
