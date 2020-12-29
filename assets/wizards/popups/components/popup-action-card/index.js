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
import { Icon, menu, moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { ActionCard, Button, CategoryAutocomplete } from '../../../../components/src';
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
			previewPopup,
			setTermsForPopup,
			setSitewideDefaultPopup,
			publishPopup,
			updatePopup,
		} = this.props;
		const { id, categories, groups, title, sitewide_default: sitewideDefault, status } = popup;
		return (
			<ActionCard
				isSmall
				className={ className }
				title={ title.length ? decodeEntities( title ) : __( '(no title)', 'newspack' ) }
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
									<Icon icon={ menu } />
								</Button>
							</Tooltip>
						) }
						<Tooltip text={ __( 'More options', 'newspack' ) }>
							<Button
								className="icon-only"
								onClick={ () => this.setState( { popoverVisibility: ! popoverVisibility } ) }
							>
								<Icon icon={ moreVertical } />
							</Button>
						</Tooltip>
						{ popoverVisibility && (
							<PopupPopover
								deletePopup={ deletePopup }
								onFocusOutside={ () => this.setState( { popoverVisibility: false } ) }
								popup={ popup }
								setSitewideDefaultPopup={ setSitewideDefaultPopup }
								updatePopup={ updatePopup }
								previewPopup={ previewPopup }
								publishPopup={ 'publish' !== status ? publishPopup : null }
							/>
						) }
					</Fragment>
				}
			>
				{ categoriesVisibility && (
					<Fragment>
						<CategoryAutocomplete
							value={ groups || [] }
							onChange={ tokens => setTermsForPopup( id, tokens, 'newspack_popups_taxonomy' ) }
							label={ __( 'Campaign groups', 'newspack ' ) }
							taxonomy='newspack_popups_taxonomy'
						/>
						<CategoryAutocomplete
							value={ categories || [] }
							onChange={ tokens => setTermsForPopup( id, tokens, 'category' ) }
							label={ __( 'Category filtering', 'newspack ' ) }
							disabled={ sitewideDefault }
						/>
					</Fragment>
				) }
			</ActionCard>
		);
	};
}

PopupActionCard.defaultProps = {
	popup: {},
	deletePopup: () => null,
	setTermsForPopup: () => null,
	setSitewideDefaultPopup: () => null,
};

export default PopupActionCard;
