/**
 * WordPress dependencies.
 */
import { CheckboxControl, SelectControl, TextControl } from '@wordpress/components';

const noop = () => {};

export default function AccessRuleControl( { slug, value, onChange }: GateAccessRuleControlProps ) {
	const rule = window.newspackAudienceContentGates.available_access_rules[ slug ];

	if ( ! rule ) {
		return null;
	}
	if ( rule.is_boolean ) {
		return <CheckboxControl label={ rule.name } checked={ true } onChange={ noop } disabled help={ rule.description } />;
	}
	if ( rule.options && rule.options.length > 0 ) {
		return (
			<SelectControl
				label={ rule.name }
				value={ value as string }
				onChange={ onChange }
				options={ rule.options.map( option => ( { value: option.value, label: option.label } ) ) }
				help={ rule.description }
			/>
		);
	}
	return <TextControl label={ rule.name } value={ value as string } onChange={ onChange } help={ rule.description } />;
}
