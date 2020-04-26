/**
 * Popup Action Card
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { Popover, MenuItem, MenuGroup, Tooltip } from '@wordpress/components';

/**
 * Material UI dependencies.
 */
import FilterListIcon from '@material-ui/icons/FilterList';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import PreviewIcon from '@material-ui/icons/Visibility';
import FrequencyIcon from '@material-ui/icons/Today';
import TestIcon from '@material-ui/icons/BugReport';
import SitewideDefaultIcon from '@material-ui/icons/Public';

/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * Internal dependencies.
 */
import {
	ActionCard,
	Button,
	CategoryAutocomplete,
	ToggleControl,
} from '../../../../components/src';
import './style.scss';

const frequencyMap = {
	never: __( 'Never', 'newspack' ),
	once: __( 'Once', 'newspack' ),
	daily: __( 'Once a day', 'newspack' ),
	always: __( 'Every page', 'newspack' ),
};

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
							<Popover
								position="bottom left"
								className="newspack-popover"
								onFocusOutside={ () => this.setState( { popoverVisibility: false } ) }
							>
								{ 'inline' !== placement && (
									<MenuItem
										onClick={ () => null }
										icon={ <SitewideDefaultIcon /> }
										className="newspack-button"
									>
										{ __( 'Sitewide default', 'newspack' ) }
										<ToggleControl
											className="newspack-popup-action-card-popover-control"
											checked={ sitewideDefault }
											onChange={ value =>
												this.setState( { popoverVisibility: false }, () =>
													setSitewideDefaultPopup( id, value )
												)
											}
										/>
									</MenuItem>
								) }
								<MenuItem onClick={ () => null } icon={ <TestIcon /> } className="newspack-button">
									{ __( 'Test mode', 'newspack' ) }
									<ToggleControl
										className="newspack-popup-action-card-popover-control"
										checked={ 'test' === frequency }
										onChange={ value =>
											this.setState( { popoverVisibility: false }, () =>
												updatePopup( id, { frequency: value ? 'test' : 'daily' } )
											)
										}
									/>
								</MenuItem>
								{ 'test' !== frequency && (
									<MenuItem
										onClick={ () => null }
										icon={ <FrequencyIcon /> }
										className="newspack-button"
									>
										{ frequencyMap[ frequency ] }
									</MenuItem>
								) }
								<MenuItem
									onClick={ () => null }
									icon={ <PreviewIcon /> }
									className="newspack-button"
								>
									{ __( 'Preview', 'newspack' ) }
								</MenuItem>
								<MenuItem
									href={ decodeEntities( editLink ) }
									icon={ <EditIcon /> }
									className="newspack-button"
								>
									{ __( 'Edit', 'newspack' ) }
								</MenuItem>
								<MenuItem
									onClick={ () => deletePopup( id ) }
									icon={ <DeleteIcon /> }
									className="newspack-button"
								>
									{ __( 'Delete', 'newspack' ) }
								</MenuItem>
							</Popover>
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
