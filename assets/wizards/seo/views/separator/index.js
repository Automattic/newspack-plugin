/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { ButtonGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, withWizardScreen } from '../../../../components/src';

const SEPARATORS = [ '-', '–', '—', '•', '|' ];

/**
 * SEO Separator screen.
 */
class Separator extends Component {
	/**
	 * Render.
	 */
	render() {
		const { data, onChange } = this.props;
		const { titleSeparator } = data;
		return (
			<Fragment>
				<h2>Title Separator</h2>
				<p>
					{ __(
						"Choose the symbol to use as your title separator. This will display, for instance, between your post title and site name. Symbols are shown in the size they'll appear in the search results",
						'newspack'
					) }
				</p>
				<ButtonGroup>
					{ SEPARATORS.map( ( separator, index ) => (
						<Button isDefault key={ index } onClick={ () => onChange( { titleSeparator: separator } ) } selected={ separator === titleSeparator } >
							{ separator }
						</Button>
					) ) }
				</ButtonGroup>
			</Fragment>
		);
	}
}
Separator.defaultProps = {
	data: {},
};

export default withWizardScreen( Separator );
