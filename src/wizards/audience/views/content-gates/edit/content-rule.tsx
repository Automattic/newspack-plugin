/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import { CardBody, ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ContentRuleControl from './content-rule-control';

export default function ContentRule( { config, enabled, onToggle = () => {}, rule, slug, onChange, onChangeExclusion }: GateContentRuleProps ) {
	return (
		<CardBody>
			<ToggleControl label={ config.name } help={ config.description } checked={ enabled } onChange={ () => onToggle( slug ) } />
			{ enabled && (
				<ContentRuleControl
					slug={ slug }
					value={ rule?.value ?? config.default }
					onChange={ onChange }
					onChangeExclusion={ onChangeExclusion }
				/>
			) }
		</CardBody>
	);
}
