/**
 * "Components Demo" Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';


/**
 * Internal dependencies
 */
import {
	FormattedHeader,
	Card,
} from '../../../components';

/**
 * Components demo for example purposes.
 */
class WordAds extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			frontPage: false,
			posts: false,
			pages: false,
			archives: false,
			topOfPage: false,
			secondBelowPost: false,
		};
	}

	/**
	 * Render the example stub.
	 */
	render() {
		const {
			frontPage,
			posts,
			pages,
			archives,
			topOfPage,
			secondBelowPost,
		} = this.state;
		return (
			<Fragment>
				<FormattedHeader
					headerText={ __( 'WordAds from WordPress.com' ) }
					subHeaderText={ __( 'Enhance your Newspack site with advertising with WordAds from WordPress.com.' ) }
				/>
				<Card>
					<div className="newspack-card-header">
						<h1>{ __( 'Ad Placements' ) }</h1>
						<h2>{ __( 'Display ads below posts on' ) }</h2>
					</div>
					<ToggleControl
						label="Front Page"
						checked={ frontPage }
						onChange={ () => this.setState( { frontPage: ! frontPage } ) }
					/>
					<ToggleControl
						label="Posts"
						checked={ posts }
						onChange={ () => this.setState( { posts: ! posts } ) }
					/>
					<ToggleControl
						label="Pages"
						checked={ pages }
						onChange={ () => this.setState( { pages: ! pages } ) }
					/>
					<ToggleControl
						label="Archives"
						checked={ archives }
						onChange={ () => this.setState( { archives: ! archives } ) }
					/>
				</Card>
				<Card>
					<div className="newspack-card-header">
						<h1>{ __( 'Additional Ad Placements' ) }</h1>
					</div>
					<ToggleControl
						label="Top of each page"
						checked={ topOfPage }
						onChange={ () => this.setState( { topOfPage: ! topOfPage } ) }
					/>
					<ToggleControl
						label="Second ad below post"
						checked={ secondBelowPost }
						onChange={ () => this.setState( { secondBelowPost: ! secondBelowPost } ) }
					/>
				</Card>
			</Fragment>
		);
	}
}

export default WordAds;
