/**
 * Category Autocomplete
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { Component } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies.
 */
import { FormTokenField } from '../';
import './style.scss';

/**
 * External dependencies
 */
import { debounce, find, filter } from 'lodash';
import classnames from 'classnames';

/**
 * Category autocomplete field component.
 */
class CategoryAutocomplete extends Component {
	state = {
		suggestions: {},
		allCategories: {},
	};

	/**
	 * Class constructor.
	 */
	constructor( props ) {
		super( props );
		this.debouncedUpdateSuggestions = debounce( this.updateSuggestions, 100 );
	}

	componentDidMount() {
		apiFetch( {
			path: addQueryArgs( `/wp/v2/${ this.props.taxonomy }`, {
				per_page: -1,
				_fields: 'id,name',
			} ),
		} ).then( categories => this.setState( { allCategories: categories } ) );
	}

	/**
	 * Clean up debounced suggestions method.
	 */
	componentWillUnmount() {
		this.debouncedUpdateSuggestions.cancel();
	}

	/**
	 * Refresh the autocomplete UI based on text that was typed.
	 *
	 * @param {string} search The typed text to search for.
	 */
	updateSuggestions( search ) {
		apiFetch( {
			path: addQueryArgs( `/wp/v2/${ this.props.taxonomy }`, {
				search,
				per_page: 20,
				_fields: 'id,name',
				orderby: 'count',
				order: 'desc',
			} ),
		} ).then( categories => {
			this.setState( {
				suggestions: categories.reduce(
					( accumulator, category ) => ( { ...accumulator, [ category.name ]: category } ),
					{}
				),
			} );
		} );
	}

	/**
	 * Prepare categories data for the API endpoint, call the change handler.
	 *
	 * @param {Array} tokens An array of category tokens.
	 */
	handleOnChange = tokens => {
		const { onChange } = this.props;
		const { suggestions } = this.state;
		// Categories that are already will be objects, while new additions will be strings (the name).
		// allValues nomalizes the array so that they are all objects.
		const allValues = tokens.map( token =>
			typeof token === 'string' ? suggestions[ token ] : token
		);
		onChange( allValues );
	};

	getAvailableSuggestions = () => {
		const { value } = this.props;
		const { suggestions } = this.state;
		const selectedIds = value.reduce( ( acc, item ) => {
			acc.push( item.id );
			return acc;
		}, [] );
		const availableSuggestions = filter(
			suggestions,
			( { id } ) => selectedIds.indexOf( id ) === -1
		);
		return availableSuggestions.map( v => v.name );
	};

	/**
	 * Render the component.
	 */
	render() {
		const {
			className,
			disabled,
			description,
			hideHelpFromVision,
			hideLabelFromVision,
			label,
			value,
		} = this.props;
		const { allCategories } = this.state;
		const classes = classnames( 'newspack-category-autocomplete', className );
		return (
			<div className={ classes }>
				<FormTokenField
					onInputChange={ input => this.debouncedUpdateSuggestions( input ) }
					value={ value.reduce( ( acc, item ) => {
						const categoryOrItem =
							typeof item === 'number' ? find( allCategories, [ 'id', item ] ) : item;
						if ( categoryOrItem ) {
							acc.push( {
								id: categoryOrItem.term_id || categoryOrItem.id,
								value: categoryOrItem.value || categoryOrItem.name,
							} );
						}
						return acc;
					}, [] ) }
					suggestions={ this.getAvailableSuggestions() }
					onChange={ this.handleOnChange }
					label={ label }
					disabled={ disabled }
					description={ description }
					hideHelpFromVision={ hideHelpFromVision }
					hideLabelFromVision={ hideLabelFromVision }
				/>
			</div>
		);
	}
}

CategoryAutocomplete.defaultProps = {
	taxonomy: 'categories',
};

export default CategoryAutocomplete;
