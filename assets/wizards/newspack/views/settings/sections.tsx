/**
 * Newspack - Dashboard, Sections
 *
 * Component for outputting sections with grid and cards
 */
import { __ } from '@wordpress/i18n';

const { sections: settingsSections } = window.newspackSettings;

import Connections from './tabs/connections';

type SectionKeys = keyof typeof settingsSections;

const sectionComponents: Record< SectionKeys | 'default', () => JSX.Element > = {
	connections: Connections,
	// emails: Emails,
	// social: Social,
	// syndication: Syndication,
	// seo: Seo,
	// 'theme-and-brand': ThemeAndBrand,
	// 'display-settings': DisplaySettings,
	// 'additional-brands': AdditionalBrands,
	default: () => <h2>🚫 { __( 'Not found' ) }</h2>,
};

const SettingsSectionKeys = Object.keys( settingsSections ) as SectionKeys[];

export default SettingsSectionKeys.map( sectionPath => {
	return {
		label: settingsSections[ sectionPath ].label,
		exact: '/' === ( settingsSections[ sectionPath ].path ?? '' ),
		path: settingsSections[ sectionPath ].path ?? `/${ sectionPath }`,
		render: sectionComponents[ sectionPath ] ?? sectionComponents.default,
	};
} );
