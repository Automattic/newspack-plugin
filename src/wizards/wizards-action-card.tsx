/**
 * Settings Wizard: Action Card component.
 */

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
				checkbox:
					// eslint-disable-next-line no-nested-ternary
					typeof isChecked === 'undefined'
						? undefined
						: isChecked
						? 'checked'
						: 'unchecked',
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
