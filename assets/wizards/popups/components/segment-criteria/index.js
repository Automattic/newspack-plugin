/**
 * Segment criteria component.
 */

/**
 * Internal dependencies.
 */
import { ActionCard } from '../../../../components/src';
import './style.scss';

const SegmentCriteria = props => {
	const { children, isEnabled, isOpen, notification } = props;
	return (
		<ActionCard
			{ ...props }
			toggleChecked={ isEnabled }
			notification={ isOpen && ! isEnabled ? notification : null }
			notificationLevel="error"
		>
			{ isOpen ? children : null }
		</ActionCard>
	);
};

export default SegmentCriteria;
