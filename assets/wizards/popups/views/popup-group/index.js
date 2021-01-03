/**
 * Pop-ups wizard screen.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';

/**
 * External dependencies.
 */
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
	ActionCardSections,
	Button,
	Card,
	Grid,
	SelectControl,
} from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';
import SegmentationPreview from '../../components/segmentation-preview';
import './style.scss';

const descriptionForPopup = (
	{ categories, sitewide_default: sitewideDefault, options },
	segments
) => {
	const segment = find( segments, [ 'id', options.selected_segment_id ] );
	const descriptionMessages = [];
	switch ( options.placement ) {
		case 'above_header':
			descriptionMessages.push( __( 'Above header', 'newspack' ) );
			break;
		case 'inline':
			descriptionMessages.push( __( 'Inline', 'newspack' ) );
			break;
		default:
			descriptionMessages.push( __( 'Overlay', 'newspack' ) );
			break;
	}
	if ( segment ) {
		descriptionMessages.push( `${ __( 'Segment:', 'newspack' ) } ${ segment.name }` );
	}
	if ( sitewideDefault ) {
		descriptionMessages.push( __( 'Sitewide default', 'newspack' ) );
	}
	if ( categories.length > 0 ) {
		descriptionMessages.push(
			__( 'Categories: ', 'newspack' ) + categories.map( category => category.name ).join( ', ' )
		);
	}
	return descriptionMessages.length ? descriptionMessages.join( ' | ' ) : null;
};

/**
 * Popup group screen
 */
const PopupGroup = ( {
	deletePopup,
	emptyMessage,
	items: { active = [], draft = [], test = [], inactive = [] },
	manageCampaignGroup,
	previewPopup,
	setTermsForPopup,
	setSitewideDefaultPopup,
	publishPopup,
	updatePopup,
	segments,
	settings,
} ) => {
	const activeCampaignGroup = settings.reduce(
		( acc, { key, value } ) => ( key === 'newspack_popups_active_campaign_group' ? value : acc ),
		null
	);
	const [ campaignGroup, setCampaignGroup ] = useState( activeCampaignGroup || -1 );
	const [ campaignGroups, setCampaignGroups ] = useState( [] );
	const [ segmentId, setSegmentId ] = useState();
	useEffect( () => {
		apiFetch( {
			path: '/wp/v2/newspack_popups_taxonomy?_fields=id,name',
		} ).then( terms => setCampaignGroups( terms ) );
	}, [] );

	const getCardClassName = ( { key }, { sitewide_default } ) =>
		( {
			active: sitewide_default ? 'newspack-card__is-primary' : 'newspack-card__is-supported',
			test: 'newspack-card__is-secondary',
			inactive: 'newspack-card__is-disabled',
			draft: 'newspack-card__is-disabled',
		}[ key ] );

	const filteredByGroup = itemsToFilter =>
		-1 === campaignGroup
			? itemsToFilter
			: itemsToFilter.filter(
					( { campaign_groups: groups } ) =>
						groups && groups.find( term => +term.term_id === campaignGroup )
			  );
	return (
		<Fragment>
			<Grid>
				<Card className="newspack__campaigns-wizard__select-with-button" noBorder>
					<SelectControl
						options={ [
							{ value: -1, label: __( 'All Campaigns', 'newspack' ) },
							...campaignGroups.map( term => ( {
								value: term.id,
								label:
									term.name +
									( activeCampaignGroup === term.id ? __( ' (Active)', 'newspack' ) : '' ),
							} ) ),
						] }
						value={ campaignGroup }
						onChange={ value => setCampaignGroup( +value ) }
						label={ __( 'Campaign groups', 'newspack' ) }
					/>
					{ campaignGroup > 0 && activeCampaignGroup !== campaignGroup && (
						<Button isTertiary onClick={ () => manageCampaignGroup( campaignGroup ) }>
							{ __( 'Activate', 'newspack' ) }
						</Button>
					) }
					{ campaignGroup > 0 && activeCampaignGroup === campaignGroup && (
						<Button isTertiary onClick={ () => manageCampaignGroup( campaignGroup, 'DELETE' ) }>
							{ __( 'Deactivate', 'newspack' ) }
						</Button>
					) }
				</Card>
				{ campaignGroup > 0 && (
					<Card className="newspack__campaigns-wizard__select-with-button" noBorder>
						<SelectControl
							options={ [
								{ value: '', label: __( 'Default (no segment)', 'newspack' ) },
								...segments.map( s => ( { value: s.id, label: s.name } ) ),
							] }
							value={ segmentId }
							onChange={ setSegmentId }
							label={ __( 'Segment to preview', 'newspack' ) }
						/>
						<SegmentationPreview
							campaignGroups={ campaignGroup }
							segment={ segmentId }
							renderButton={ ( { showPreview } ) => (
								<Button isTertiary onClick={ showPreview }>
									<Icon icon={ external } />
								</Button>
							) }
						/>
					</Card>
				) }
			</Grid>
			<ActionCardSections
				sections={ [
					{ key: 'active', label: __( 'Active', 'newspack' ), items: filteredByGroup( active ) },
					{ key: 'draft', label: __( 'Draft', 'newspack' ), items: filteredByGroup( draft ) },
					{ key: 'test', label: __( 'Test', 'newspack' ), items: filteredByGroup( test ) },
					{
						key: 'inactive',
						label: __( 'Inactive', 'newspack' ),
						items: filteredByGroup( inactive ),
					},
				] }
				renderCard={ ( popup, section ) => (
					<PopupActionCard
						className={ getCardClassName( section, popup ) }
						deletePopup={ deletePopup }
						description={ descriptionForPopup( popup, segments ) }
						key={ popup.id }
						popup={ popup }
						previewPopup={ previewPopup }
						setTermsForPopup={ setTermsForPopup }
						setSitewideDefaultPopup={ setSitewideDefaultPopup }
						updatePopup={ updatePopup }
						publishPopup={ section.key === 'draft' ? publishPopup : undefined }
					/>
				) }
				emptyMessage={ emptyMessage }
			/>
		</Fragment>
	);
};
export default withWizardScreen( PopupGroup );
