/**
 * Popup Action Card
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { Popover, MenuItem } from '@wordpress/components';

/**
 * Material UI dependencies.
 */
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import PreviewIcon from '@material-ui/icons/Visibility';
import FrequencyIcon from '@material-ui/icons/Today';
import TestIcon from '@material-ui/icons/BugReport';
import SitewideDefaultIcon from '@material-ui/icons/Public';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';

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

const frequenciesForPopup = ( { options } ) => {
	const { placement } = options;
	return Object.keys( frequencyMap )
		.filter( key => ! ( 'always' === key && 'inline' !== placement ) )
		.map( key => ( { label: frequencyMap[ key ], value: key } ) );
};

class PopupPopover extends Component {
	state = {
		frequencyVisibility: false,
	};
	/**
	 * Render.
	 */
	render = () => {
		const { frequencyVisibility } = this.state;
		const { deletePopup, popup, setSitewideDefaultPopup, onFocusOutside, updatePopup } = this.props;
		const { id, sitewide_default: sitewideDefault, edit_link: editLink, options } = popup;
		const { frequency, placement } = options;
		return (
			<Popover
				position="bottom left"
				className="newspack-popover"
				onFocusOutside={ onFocusOutside }
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
							onChange={ value => {
								setSitewideDefaultPopup( id, value );
								onFocusOutside();
							} }
						/>
					</MenuItem>
				) }
				<MenuItem onClick={ () => null } icon={ <TestIcon /> } className="newspack-button">
					{ __( 'Test mode', 'newspack' ) }
					<ToggleControl
						className="newspack-popup-action-card-popover-control"
						checked={ 'test' === frequency }
						onChange={ value => {
							updatePopup( id, { frequency: value ? 'test' : 'daily' } );
							onFocusOutside();
						} }
					/>
				</MenuItem>
				{ 'test' !== frequency && (
					<MenuItem
						icon={ <FrequencyIcon /> }
						className="newspack-button"
						onClick={ () => this.setState( { frequencyVisibility: ! frequencyVisibility } ) }
					>
						{ frequencyMap[ frequency ] }
						<KeyboardArrowDown className="newspack-popup-action-card-popover-control" />
					</MenuItem>
				) }
				{ frequencyVisibility &&
					frequenciesForPopup( popup ).map( ( { label, value } ) => (
						<MenuItem
							key={ value }
							onClick={ () => {
								updatePopup( id, { frequency: value } );
								onFocusOutside();
							} }
						>
							{ label }
						</MenuItem>
					) ) }
				<MenuItem onClick={ () => null } icon={ <PreviewIcon /> } className="newspack-button">
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
		);
	};
}

export default PopupPopover;
