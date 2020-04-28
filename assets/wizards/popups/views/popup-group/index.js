/**
 * Pop-ups wizard screen.
 */

/**
 * WordPress dependencies.
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen } from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';
import './style.scss';

/**
 * Popup group screen
 */

class PopupGroup extends Component {
	/**
	 * Construct the appropriate description for a single Pop-up based on categories and sitewide default status.
	 *
	 * @param {Object} popup object.
	 */
	descriptionForPopup = ( { categories, sitewide_default: sitewideDefault } ) => {
		if ( sitewideDefault ) {
			return __( 'Sitewide default', 'newspack' );
		}
		if ( categories.length > 0 ) {
			return (
				__( 'Categories: ', 'newspack' ) + categories.map( category => category.name ).join( ', ' )
			);
		}
		return null;
	};

	/**
	 * Render.
	 */
	render() {
		const {
			deletePopup,
			emptyMessage,
			items = {},
			previewPopup,
			setCategoriesForPopup,
			setSitewideDefaultPopup,
			updatePopup,
		} = this.props;
		const { active = [], test = [], inactive = [] } = items;
		const sections = [];
		if ( active.length > 0 ) {
			sections.push(
				<Fragment>
					<h3>
						{ __( 'Active', 'newspack' ) }{' '}
						<span className="newspack-popups-wizard__group_count">{ active.length }</span>
					</h3>
					{ active.map( popup => (
						<PopupActionCard
							className={
								popup.sitewide_default ? 'newspack-card__is-primary' : 'newspack-card__is-supported'
							}
							deletePopup={ deletePopup }
							description={ this.descriptionForPopup( popup ) }
							key={ popup.id }
							popup={ popup }
							previewPopup={ previewPopup }
							setCategoriesForPopup={ setCategoriesForPopup }
							setSitewideDefaultPopup={ setSitewideDefaultPopup }
							updatePopup={ updatePopup }
						/>
					) ) }
				</Fragment>
			);
		}
		if ( test.length > 0 ) {
			sections.push(
				<Fragment>
					<h3>
						{ __( 'Test mode', 'newspack' ) }{' '}
						<span className="newspack-popups-wizard__group_count">{ test.length }</span>
					</h3>
					{ test.map( popup => (
						<PopupActionCard
							className="newspack-card__is-secondary"
							deletePopup={ deletePopup }
							description={ this.descriptionForPopup( popup ) }
							key={ popup.id }
							popup={ popup }
							previewPopup={ previewPopup }
							setCategoriesForPopup={ setCategoriesForPopup }
							setSitewideDefaultPopup={ setSitewideDefaultPopup }
							updatePopup={ updatePopup }
						/>
					) ) }
				</Fragment>
			);
		}
		if ( inactive.length > 0 ) {
			sections.push(
				<Fragment>
					<h3>
						{ __( 'Inactive', 'newspack' ) }{' '}
						<span className="newspack-popups-wizard__group_count">{ inactive.length }</span>
					</h3>
					{ inactive.map( popup => (
						<PopupActionCard
							className="newspack-card__is-disabled"
							deletePopup={ deletePopup }
							description={ this.descriptionForPopup( popup ) }
							key={ popup.id }
							popup={ popup }
							previewPopup={ previewPopup }
							setCategoriesForPopup={ () => null }
							setSitewideDefaultPopup={ setSitewideDefaultPopup }
							updatePopup={ updatePopup }
						/>
					) ) }
				</Fragment>
			);
		}
		return sections.length > 0 ? (
			sections.reduce(
				( acc, item, index ) => [ ...acc, item, index < sections.length - 1 && <hr /> ],
				[]
			)
		) : (
			<p>{ emptyMessage }</p>
		);
	}
}

export default withWizardScreen( PopupGroup );
