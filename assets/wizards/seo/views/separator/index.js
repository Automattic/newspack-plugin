/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, ButtonGroup, TextControl, withWizardScreen } from '../../../../components/src';

const SEPARATORS = {
	'sc-dash': '-',
	'sc-ndash': '&ndash;',
	'sc-mdash': '&mdash;',
	'sc-bull': '&bull;',
	'sc-star': '*',
	'sc-pipe': '|',
};

/**
 * SEO Separator screen.
 */
class Separator extends Component {
	/**
	 * Generate sample page title using selected separator.
	 */
	exampleTitle = titleSeparator => {
		const separator = SEPARATORS[ titleSeparator ];
		const blogName =
			window && window.newspack_urls
				? window.newspack_urls.bloginfo.name
				: __( 'Site Name', 'newspack' );
		return `${ __( 'Homepage', 'newspack' ) } ${ separator } ${ blogName }`;
	};

	/**
	 * Render.
	 */
	render() {
		const { data, onChange } = this.props;
		const { titleSeparator } = data;
		return (
			<Fragment>
				<h2>{ __( 'Title separator', 'newspack' ) }</h2>
				<p>
					{ __(
						"Choose the symbol to use as your title separator. This will display, for instance, between your post title and site name. Symbols are shown in the size they'll appear in the search results.",
						'newspack'
					) }
				</p>
				<ButtonGroup>
					{ Object.keys( SEPARATORS ).map( key => {
						const value = decodeEntities( SEPARATORS[ key ] );
						return (
							<Button
								key={ key }
								onClick={ () => onChange( { titleSeparator: key } ) }
								isPrimary={ key === titleSeparator }
								isDefault={ key !== titleSeparator }
							>
								{ value }
							</Button>
						);
					} ) }
				</ButtonGroup>
				<TextControl
					disabled
					label={ __( 'Example Title', 'newspack' ) }
					onChange={ () => null }
					value={ decodeEntities( this.exampleTitle( titleSeparator ) ) }
				/>
			</Fragment>
		);
	}
}
Separator.defaultProps = {
	data: {},
	onChange: () => null,
};

export default withWizardScreen( Separator );
