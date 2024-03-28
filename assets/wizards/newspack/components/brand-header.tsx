/**
 * Newspack Dashboard, Brand-Header
 *
 * Displaying stored logo and header bg color in a header
 */

import { BoxContrast } from '../../../components/src';

const { settings } = window.newspack_dashboard;

const BrandHeader = () => {
	return (
		<header
			className="newspack-dashboard__brand-header"
			style={ { backgroundColor: settings.headerBgColor } }
		>
			<BoxContrast
				className="brand-header__inner"
				content={ <h1>{ settings.siteName }</h1> }
				hexColor={ settings.headerBgColor }
				cssProp="background-color"
			/>
		</header>
	);
};

export default BrandHeader;
