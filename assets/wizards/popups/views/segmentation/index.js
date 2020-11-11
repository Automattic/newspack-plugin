/**
 * Internal dependencies.
 */
import { withWizardScreen } from '../../../../components/src';
import SegmentsList from './SegmentsList';
import SingleSegment from './SingleSegment';
import './style.scss';

/**
 * Popups Segmentation screen.
 */
const PopupSegmentation = ( { wizardApiFetch, match } ) => {
	const segmentId = match.params.id;
	return segmentId ? (
		<SingleSegment segmentId={ segmentId } wizardApiFetch={ wizardApiFetch } />
	) : (
		<SegmentsList wizardApiFetch={ wizardApiFetch } />
	);
};

export default withWizardScreen( PopupSegmentation );
