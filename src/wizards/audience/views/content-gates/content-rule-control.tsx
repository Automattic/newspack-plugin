/* global newspackAudienceContentGates */

/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ContentRuleControlTaxonomy from './content-rule-control-taxonomy';
import { FormTokenField } from '../../../../../packages/components/src';

export default function ContentRuleControl( { slug, value, onChange }: GateRuleControlProps ) {
	const rule = window.newspackAudienceContentGates.available_content_rules[ slug ];
	if ( ! rule || ! Array.isArray( value ) ) {
		return null;
	}

	if ( rule.options && rule.options.length > 0 ) {
		return (
			<>
				<FormTokenField
					label={ rule.name }
					value={ rule.options.filter( o => value.includes( o.value ) ).map( o => o.label ) }
					onChange={ ( items: string[] ) => onChange( rule.options.filter( o => items.includes( o.label ) ).map( o => o.value ) ) }
					suggestions={ rule.options.map( o => o.label ) }
					__experimentalExpandOnFocus={ true }
				/>
			</>
		);
	}

	return <ContentRuleControlTaxonomy slug={ slug } value={ value } onChange={ onChange } />;
}
