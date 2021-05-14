/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * External dependencies.
 */
import { AutocompleteTokenField } from '../';
import './style.scss';

class AutocompleteWithSuggestions extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			suggestions: [],
		};
	}

	/**
	 * Fetch recent posts to show as suggestions.
	 */
	componentDidMount() {
		this.props.fetchSuggestions().then( suggestions => {
			if ( 0 < suggestions.length ) {
				this.setState( { suggestions } );
			}
		} );
	}

	/**
	 * Render a single suggestion object that can be clicked to select it immediately.
	 *
	 * @param {Object} suggestion Suggestion object with value and label keys.
	 * @param {number} index Index of this suggestion in the array.
	 */
	renderSuggestion( suggestion, index ) {
		const { onChange } = this.props;
		return (
			<Button isLink key={ index } onClick={ () => onChange( [ suggestion ] ) }>
				{ suggestion.label }
			</Button>
		);
	}

	/**
	 * Render a list of suggestions that can be clicked to select instead of searching by title.
	 */
	renderSuggestions() {
		const { postTypeLabel } = this.props;
		const { suggestions } = this.state;

		return (
			<>
				<p className="newspack-autocomplete-with-suggestions__label">
					{ __( 'Or, select a recent ', 'newspack' ) + sprintf( ' %s:', postTypeLabel ) }
				</p>
				<div className="newspack-autocomplete-with-suggestions__search-suggestions">
					{ suggestions.map( this.renderSuggestion.bind( this ) ) }
				</div>
			</>
		);
	}

	render = () => {
		const { fetchSuggestions, fetchSavedPosts, label, help, selectedPost, onChange } = this.props;
		const { suggestions } = this.state;

		return (
			<div className="newspack-autocomplete-with-suggestions">
				<AutocompleteTokenField
					tokens={ [ selectedPost ] }
					onChange={ onChange }
					fetchSuggestions={ fetchSuggestions }
					fetchSavedInfo={ postIDs => fetchSavedPosts( postIDs ) }
					label={ label }
					help={ help }
				/>
				{ 0 < suggestions.length && this.renderSuggestions() }
			</div>
		);
	};
}

AutocompleteWithSuggestions.defaultProps = {
	fetchSavedPosts: () => false,
	fetchSuggestions: () => false,
	onChange: () => false,
	help: __( 'Begin typing search term, click autocomplete result to select.', 'newspack' ),
	label: __( 'Search', 'newspack' ),
	postType: 'post',
	postTypeLabel: __( 'post', 'newspack' ),
	selectedPost: 0,
};

export default AutocompleteWithSuggestions;
