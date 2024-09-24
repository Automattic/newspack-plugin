/**
 * Newspack - Dashboard, Sections
 *
 * Component for outputting sections with grid and cards
 */
import { __ } from '@wordpress/i18n';

const settingsTabs = window.newspackSettings;

import Social from './social';
import Emails from './emails';
import Connections from './connections';
import Syndication from './syndication';
import ThemeAndBrand from './theme-and-brand';
import Seo from './seo';
import AdditionalBrands from './additional-brands';

type SectionKeys = keyof typeof settingsTabs;

const sectionComponents: Record<
	SectionKeys | 'default',
	( a: { isPartOfSetup?: boolean } ) => React.ReactNode
> = {
	connections: Connections,
	social: Social,
	emails: Emails,
	syndication: Syndication,
	seo: Seo,
	'theme-and-brand': ThemeAndBrand,
	// 'display-settings': DisplaySettings,
	'additional-brands': AdditionalBrands,
	default: () => <h2>🚫 { __( 'Not found' ) }</h2>,
};

const settingsSectionKeys = Object.keys( settingsTabs ) as SectionKeys[];

export default settingsSectionKeys.map( sectionPath => {
	return {
		label: settingsTabs[ sectionPath ].label,
		exact: '/' === ( settingsTabs[ sectionPath ].path ?? '' ),
		path: settingsTabs[ sectionPath ].path ?? `/${ sectionPath }`,
		render: sectionComponents[ sectionPath ] ?? sectionComponents.default,
	};
} );
