/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { ButtonGroup } from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, withWizardScreen } from '../../../../components/src';

const SEPARATORS = {
	'sc-dash': '-',
	'sc-ndash': '&ndash;',
	'sc-mdash': '&mdash;',
	'sc-star': '*',
	'sc-pipe': '|',
};

/**
 * SEO Separator screen.
 */
class Separator extends Component {
	/**
	 * Render.
	 */
	render() {
		const { data, onSeparatorChange } = this.props;
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
					{ Object.keys( SEPARATORS ).map( key => {
						const value = decodeEntities( SEPARATORS[ key ] );
						return (
							<Button
								key={ key }
								onClick={ () => onSeparatorChange( key ) }
								isPrimary={ key === titleSeparator }
								isDefault={ key !== titleSeparator }
							>
								{ value }
							</Button>
						);
					} ) }
				</ButtonGroup>
			</Fragment>
		);
	}
}
Separator.defaultProps = {
	data: {},
};

export default withWizardScreen( Separator );
