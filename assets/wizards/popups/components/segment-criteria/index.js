/**
 * Segment criteria component.
 */

/**
 * Internal dependencies.
 */
import { ActionCard } from '../../../../components/src';
import './style.scss';

const SegmentCriteria = props => {
	const { children, toggleChecked } = props;
	return <ActionCard { ...props }>{ toggleChecked ? children : null }</ActionCard>;
};

export default SegmentCriteria;
