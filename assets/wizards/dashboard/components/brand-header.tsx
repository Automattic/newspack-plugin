/**
 * Newspack Dashboard, Brand-Header
 *
 * Displaying stored logo and header bg color in a header
 */

const { settings } = window.newspack_dashboard;

const BrandHeader = () => {
	return (
		<header
			className="newspack-dashboard__brand-header"
			style={ { backgroundColor: settings.headerBgColor } }
		>
			<div className="brand-header__inner">
				<h1>{ settings.siteName }</h1>
			</div>
		</header>
	);
};

export default BrandHeader;
