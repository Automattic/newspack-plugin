/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useState } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Button, SelectControl, withWizardScreen } from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';

/**
 * Campaign groups screen.
 */
const CampaignGroups = ( {
	currentGroup,
	deletePopup,
	groups,
	campaigns,
	previewPopup,
	setCategoriesForPopup,
	setCurrentGroup,
	setSitewideDefaultPopup,
	unsetCurrentGroup,
	updatePopup,
} ) => {
	if ( currentGroup === null ) {
		return null;
	}
	const [ group, setGroup ] = useState( currentGroup);
	const filteredCampaigns =
		-1 === parseInt( group )
			? campaigns
			: campaigns.filter( ( { groups } ) => groups.indexOf( parseInt( group ) ) !== -1 );
	return (
		<Fragment>
			<SelectControl
				options={ [
					{ value: -1, label: __( 'All Campaigns', 'newspack' ) },
					...groups.map( item => ( {
						value: item.term_id,
						label:
							item.name + ( currentGroup === item.term_id ? _( ' (Selected)', 'newspack' ) : '' ),
					} ) ),
				] }
				value={ group }
				onChange={ setGroup }
				label={ __( 'Campaign Group', 'newspack' ) }
			/>
			{ parseInt( group ) > -1 && parseInt( group ) !== parseInt( currentGroup ) && (
				<Button onClick={ () => setCurrentGroup( group ) } isPrimary>
					{ __( 'Make Current', 'newspack' ) }
				</Button>
			) }
			{ parseInt( group ) > -1 && parseInt( group ) === parseInt( currentGroup ) && (
				<Button onClick={ () => unsetCurrentGroup() } isPrimary>
					{ __( 'Remove Current', 'newspack' ) }
				</Button>
			) }
			{ filteredCampaigns.map( campaign => (
				<PopupActionCard
					className="newspack-card__is-supported"
					deletePopup={ deletePopup }
					description={ null }
					key={ campaign.id }
					popup={ campaign }
					previewPopup={ previewPopup }
					setCategoriesForPopup={ setCategoriesForPopup }
					setSitewideDefaultPopup={ setSitewideDefaultPopup }
					updatePopup={ updatePopup }
					publishPopup={ null }
				/>
			) ) }
		</Fragment>
	);
};

export default withWizardScreen( CampaignGroups );
