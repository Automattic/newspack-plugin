/**
 * Settings Wizard: Action Card component.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard } from '../components/src';

const WizardsActionCard = ( {
	description,
	error,
	isChecked,
	notificationLevel = 'error',
	children,
	...props
}: ActionCardProps ) => {
	return (
		<ActionCard
			{ ...{
				description,
				checkbox: isChecked ? 'checked' : 'unchecked',
				notification: error,
				notificationLevel,
				...props,
			} }
		>
			{ children }
		</ActionCard>
	);
};

export default WizardsActionCard;
