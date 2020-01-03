/**
 * Theme Style Selection Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { StyleCard, StyleCardGroup, withWizardScreen } from '../../../../components/src';
import DefaultImg from './images/default.png';
import ScottImg from './images/scott.png';
import NelsonImg from './images/nelson.png';
import KatharineImg from './images/katharine.png';
import SachaImg from './images/sacha.png';
import JosephImg from './images/joseph.png';

/**
 * Theme Style Selection Screen.
 */
class ThemeStyleSelection extends Component {
	/**
	 * Render.
	 */
	render() {
		const { updateThemeStyle, themeStyle } = this.props;
		return (
			<StyleCardGroup>
				<StyleCard
					cardTitle={ __( 'Default', 'newspack-plugin' ) }
					image={ DefaultImg }
					url="//newspack.blog"
					isActive={ themeStyle === 'default' }
					onClick={ () => updateThemeStyle( 'default' ) }
				/>
				<StyleCard
					cardTitle="Scott"
					image={ ScottImg }
					isActive={ themeStyle === 'style-1' }
					onClick={ () => updateThemeStyle( 'style-1' ) }
				/>
				<StyleCard
					cardTitle="Nelson"
					image={ NelsonImg }
					url="//elsoberano.org"
					isActive={ themeStyle === 'style-2' }
					onClick={ () => updateThemeStyle( 'style-2' ) }
				/>
				<StyleCard
					cardTitle="Katharine"
					image={ KatharineImg }
					url="//thelensnola.org"
					isActive={ themeStyle === 'style-3' }
					onClick={ () => updateThemeStyle( 'style-3' ) }
				/>
				<StyleCard
					cardTitle="Sacha"
					image={ SachaImg }
					isActive={ themeStyle === 'style-4' }
					onClick={ () => updateThemeStyle( 'style-4' ) }
				/>
				<StyleCard
					cardTitle="Joseph"
					image={ JosephImg }
					url="//oklahomawatch.org"
					isActive={ themeStyle === 'style-5' }
					onClick={ () => updateThemeStyle( 'style-5' ) }
				/>
			</StyleCardGroup>
		);
	}
}

export default withWizardScreen( ThemeStyleSelection );
