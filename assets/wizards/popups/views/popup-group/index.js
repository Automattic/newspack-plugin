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
import { SelectControl, withWizardScreen } from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';
import './style.scss';

/**
 * Popup group screen
 */

class PopupGroup extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			filter: 'all',
		};
	}
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
		const { filter } = this.state;
		const {
			deletePopup,
			emptyMessage,
			items = {},
			previewPopup,
			setCategoriesForPopup,
			setSitewideDefaultPopup,
			publishPopup,
			updatePopup,
		} = this.props;
		const { active = [], draft = [], test = [], inactive = [] } = items;
		const sections = [];
		const filterOptions = [];
		if ( active.length > 0 ) {
			const label = __( 'Active', 'newspack' );
			if ( filter === 'all' || filter === 'active' ) {
				sections.push(
					<Fragment key="active">
						<h2 className="newspack-popups-wizard__group-type">
							{ label }{' '}
							<span className="newspack-popups-wizard__group-count">{ active.length }</span>
						</h2>
						{ active.map( popup => (
							<PopupActionCard
								className={
									popup.sitewide_default
										? 'newspack-card__is-primary'
										: 'newspack-card__is-supported'
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
			filterOptions.push( { label, value: 'active' } );
		}
		if ( test.length > 0 ) {
			const label = __( 'Test mode', 'newspack' );
			if ( filter === 'all' || filter === 'test' ) {
				sections.push(
					<Fragment key="test">
						<h2 className="newspack-popups-wizard__group-type">
							{ label }
							<span className="newspack-popups-wizard__group-count">{ test.length }</span>
						</h2>
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
			filterOptions.push( { label, value: 'test' } );
		}
		if ( inactive.length > 0 ) {
			const label = __( 'Inactive', 'newspack' );
			if ( filter === 'all' || filter === 'inactive' ) {
				sections.push(
					<Fragment key="inactive">
						<h2 className="newspack-popups-wizard__group-type">
							{ __( 'Inactive', 'newspack' ) }{' '}
							<span className="newspack-popups-wizard__group-count">{ inactive.length }</span>
						</h2>
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
			filterOptions.push( { label, value: 'inactive' } );
		}
		if ( draft.length > 0 ) {
			const label = __( 'Draft', 'newspack' );
			if ( filter === 'all' || filter === 'draft' ) {
				sections.push(
					<Fragment key="draft">
						<h2 className="newspack-popups-wizard__group-type">
							{ __( 'Draft', 'newspack' ) }{' '}
							<span className="newspack-popups-wizard__group-count">{ draft.length }</span>
						</h2>
						{ draft.map( popup => (
							<PopupActionCard
								className="newspack-card__is-disabled"
								deletePopup={ deletePopup }
								description={ this.descriptionForPopup( popup ) }
								key={ popup.id }
								popup={ popup }
								previewPopup={ previewPopup }
								publishPopup={ publishPopup }
								setCategoriesForPopup={ () => null }
								setSitewideDefaultPopup={ setSitewideDefaultPopup }
								updatePopup={ updatePopup }
							/>
						) ) }
					</Fragment>
				);
			}
			filterOptions.push( { label, value: 'draft' } );
		}
		return sections.length > 0 ? (
			<Fragment>
				{ filterOptions.length > 0 && (
					<SelectControl
						options={ [ { label: __( 'All', 'newspack' ), value: 'all' }, ...filterOptions ] }
						value={ filter }
						onChange={ value => this.setState( { filter: value } ) }
						label={ __( 'Filter:', 'newspack' ) }
						className="newspack-popups-wizard__group-select"
					/>
				) }

				{ sections.reduce( ( acc, item ) => [ ...acc, item ], [] ) }
			</Fragment>
		) : (
			<p>{ emptyMessage }</p>
		);
	}
}

export default withWizardScreen( PopupGroup );
