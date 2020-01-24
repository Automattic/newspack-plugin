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
					isActive={ themeStyle === 'newspack-theme' }
					onClick={ () => updateThemeStyle( 'newspack-theme' ) }
				/>
				<StyleCard
					cardTitle="Scott"
					image={ ScottImg }
					isActive={ themeStyle === 'newspack-scott' }
					onClick={ () => updateThemeStyle( 'newspack-scott' ) }
				/>
				<StyleCard
					cardTitle="Nelson"
					image={ NelsonImg }
					url="//elsoberano.org"
					isActive={ themeStyle === 'newspack-nelson' }
					onClick={ () => updateThemeStyle( 'newspack-nelson' ) }
				/>
				<StyleCard
					cardTitle="Katharine"
					image={ KatharineImg }
					url="//thelensnola.org"
					isActive={ themeStyle === 'newspack-katharine' }
					onClick={ () => updateThemeStyle( 'newspack-katharine' ) }
				/>
				<StyleCard
					cardTitle="Sacha"
					image={ SachaImg }
					isActive={ themeStyle === 'newspack-sacha' }
					onClick={ () => updateThemeStyle( 'newspack-sacha' ) }
				/>
				<StyleCard
					cardTitle="Joseph"
					image={ JosephImg }
					url="//oklahomawatch.org"
					isActive={ themeStyle === 'newspack-joseph' }
					onClick={ () => updateThemeStyle( 'newspack-joseph' ) }
				/>
			</StyleCardGroup>
		);
	}
}

export default withWizardScreen( ThemeStyleSelection );
