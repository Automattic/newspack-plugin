/**
 * Newspack - Dashboard, Sections
 *
 * Component for outputting sections with grid and cards
 */
import { __ } from '@wordpress/i18n';

const { tabs: settingsTabs } = window.newspackSettings;

import Connections from './connections';

type SectionKeys = keyof typeof settingsTabs;

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

const SettingsSectionKeys = Object.keys( settingsTabs ) as SectionKeys[];

export default SettingsSectionKeys.map( sectionPath => {
	return {
		label: settingsTabs[ sectionPath ].label,
		exact: '/' === ( settingsTabs[ sectionPath ].path ?? '' ),
		path: settingsTabs[ sectionPath ].path ?? `/${ sectionPath }`,
		render: sectionComponents[ sectionPath ] ?? sectionComponents.default,
	};
} );
