/**
 * Popup Action Card
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { Tooltip } from '@wordpress/components';

/**
 * Material UI dependencies.
 */
import FilterListIcon from '@material-ui/icons/FilterList';
import MoreVertIcon from '@material-ui/icons/MoreVert';

/**
 * Internal dependencies.
 */
import {
	ActionCard,
	Button,
	CategoryAutocomplete,
	ToggleControl,
} from '../../../../components/src';
import PopupPopover from '../popup-popover';
import './style.scss';

class PopupActionCard extends Component {
	state = {
		categoriesVisibility: false,
		popoverVisibility: false,
	};

	/**
	 * Render.
	 */
	render = () => {
		const { categoriesVisibility, popoverVisibility } = this.state;
		const {
			className,
			description,
			deletePopup,
			popup,
			setCategoriesForPopup,
			setSitewideDefaultPopup,
			updatePopup,
		} = this.props;
		const {
			id,
			categories,
			title,
			sitewide_default: sitewideDefault,
			edit_link: editLink,
			options,
		} = popup;
		const { frequency, placement } = options;
		return (
			<ActionCard
				className={ className }
				title={ decodeEntities( title ) }
				key={ id }
				description={ description }
				actionText={
					<Fragment>
						{ ! sitewideDefault && (
							<Tooltip text={ __( 'Category filtering', 'newspack' ) }>
								<Button
									className="icon-only"
									onClick={ () =>
										this.setState( { categoriesVisibility: ! categoriesVisibility } )
									}
								>
									<FilterListIcon />
								</Button>
							</Tooltip>
						) }
						<Tooltip text={ __( 'More options', 'newspack' ) }>
							<Button
								className="icon-only"
								onClick={ () => this.setState( { popoverVisibility: ! popoverVisibility } ) }
							>
								<MoreVertIcon />
							</Button>
						</Tooltip>
						{ popoverVisibility && (
							<PopupPopover
								onFocusOutside={ () => this.setState( { popoverVisibility: false } ) }
								popup={ popup }
								setSitewideDefaultPopup={ setSitewideDefaultPopup }
								updatePopup={ updatePopup }
							/>
						) }
					</Fragment>
				}
			>
				{ categoriesVisibility && (
					<CategoryAutocomplete
						value={ categories || [] }
						onChange={ tokens => setCategoriesForPopup( id, tokens ) }
						label={ __( 'Category filtering', 'newspack ' ) }
						disabled={ sitewideDefault }
					/>
				) }
			</ActionCard>
		);
	};
}

PopupActionCard.defaultProps = {
	popup: {},
	deletePopup: () => null,
	setCategoriesForPopup: () => null,
	setSitewideDefaultPopup: () => null,
};

export default PopupActionCard;
